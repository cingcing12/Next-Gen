import Product from '../models/Product.js';
import { EventEmitter } from 'events';
import { systemEvents } from '../events/systemEvents.js';

export const productEvents = new EventEmitter();

// @desc    SSE stream for products (Legacy, use system stream)
// @route   GET /api/products/stream
// @access  Public
export const streamProducts = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const handleProductCreated = (product) => sendEvent('product_created', product);
  const handleProductUpdated = (product) => sendEvent('product_updated', product);
  const handleProductDeleted = (id) => sendEvent('product_deleted', { _id: id });

  productEvents.on('product_created', handleProductCreated);
  productEvents.on('product_updated', handleProductUpdated);
  productEvents.on('product_deleted', handleProductDeleted);
  
  // Also listen to systemEvents for product updates (e.g. wishlist, orders)
  systemEvents.on('product_updated', handleProductUpdated);

  req.on('close', () => {
    productEvents.off('product_created', handleProductCreated);
    productEvents.off('product_updated', handleProductUpdated);
    productEvents.off('product_deleted', handleProductDeleted);
    systemEvents.off('product_updated', handleProductUpdated);
  });
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) {
      query.category = { $regex: new RegExp(`^${req.query.category}$`, 'i') };
    }
    if (req.query.subCategory) {
      query.subCategory = { $regex: new RegExp(`^${req.query.subCategory}$`, 'i') };
    }
    
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// @desc    Track add to cart event
// @route   POST /api/products/:id/track-cart
// @access  Public
export const trackCart = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const qty = parseInt(req.body.qty) || 1;
    product.cartCount += qty;
    
    if (req.user) {
      const uIndex = product.cartUsers.findIndex(u => u.user && u.user.toString() === req.user._id.toString());
      if (uIndex > -1) {
        product.cartUsers[uIndex].count += qty;
      } else {
        product.cartUsers.push({ user: req.user._id, count: qty });
      }
    }
    
    await product.save();
    productEvents.emit('product_updated', product);
    systemEvents.emit('product_updated', product);
    res.json({ message: 'Cart tracked', cartCount: product.cartCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track cart', error: error.message });
  }
};

// @desc    Untrack remove from cart event
// @route   POST /api/products/:id/untrack-cart
// @access  Public
export const untrackCart = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const qty = parseInt(req.body.qty) || 1;
    product.cartCount = Math.max(0, product.cartCount - qty);
    
    if (req.user) {
      const uIndex = product.cartUsers.findIndex(u => u.user && u.user.toString() === req.user._id.toString());
      if (uIndex > -1) {
        product.cartUsers[uIndex].count -= qty;
        if (product.cartUsers[uIndex].count <= 0) {
          product.cartUsers.splice(uIndex, 1);
        }
      }
    }
    
    await product.save();
    productEvents.emit('product_updated', product);
    systemEvents.emit('product_updated', product);
    res.json({ message: 'Cart untracked', cartCount: product.cartCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to untrack cart', error: error.message });
  }
};

import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Get detailed analytics for a product
// @route   GET /api/products/:id/analytics-details
// @access  Private/Admin
export const getProductAnalyticsDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Get users who added to cart
    const product = await Product.findById(productId).populate('cartUsers.user', 'fullName email image');
    const cartUsers = product ? product.cartUsers : [];

    // 2. Get users who added to wishlist
    const wishlistUsers = await User.find({ wishlist: productId }).select('fullName email image');

    // 3. Get users who bought this product
    const orders = await Order.find({ 'orderItems.product': productId }).populate('user', 'fullName email image');
    const boughtUsersMap = new Map();
    orders.forEach(order => {
      if (order.user && !boughtUsersMap.has(order.user._id.toString())) {
        boughtUsersMap.set(order.user._id.toString(), order.user);
      }
    });
    const boughtUsers = Array.from(boughtUsersMap.values());

    res.json({
      cartUsers,
      wishlistUsers,
      boughtUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics details', error: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, price, discount, description, images, category, subCategory, stock, sizes, colors, colorVariants } = req.body;
    
    // DEBUG LOGGING
    import('fs').then(fs => {
      fs.appendFileSync('debug-stock.log', 'CREATE req.body: ' + JSON.stringify(req.body) + '\n');
    });
    
    // Auto-derive colors and aggregate images from colorVariants if available
    let resolvedColors = colors;
    let resolvedImages = images || [];
    
    if (colorVariants && Array.isArray(colorVariants) && colorVariants.length > 0) {
      if (!resolvedColors || resolvedColors.length === 0) {
        resolvedColors = colorVariants.map(v => v.color).filter(Boolean);
      }
      // Collect variant images
      const variantImages = colorVariants.map(v => v.image).filter(Boolean);
      resolvedImages = [...new Set([...resolvedImages, ...variantImages])];
    }

    const product = new Product({
      name: name || 'Sample name',
      price: price || 0,
      discount: discount || 0,
      description: description || 'Sample description',
      images: resolvedImages.length > 0 ? resolvedImages : ['https://via.placeholder.com/150'],
      category: category || 'Men',
      subCategory: subCategory || '',
      stock: (colorVariants && colorVariants.length > 0)
        ? colorVariants.reduce((total, v) => {
            if (Array.isArray(v.sizeVariants) && v.sizeVariants.length > 0) {
              return total + v.sizeVariants.reduce((s, sv) => s + (Number(sv.stock) || 0), 0);
            }
            return total + (Number(v.stock) || 0);
          }, 0)
        : (Number(stock) || 0),
      sizes: sizes || ['M', 'L'],
      colors: resolvedColors || ['Black', 'White'],
      colorVariants: colorVariants || [],
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    });
    
    import('fs').then(fs => {
      fs.appendFileSync('debug-stock.log', 'CREATE product before save: ' + JSON.stringify(product) + '\n');
    });

    const createdProduct = await product.save();
    productEvents.emit('product_created', createdProduct);
    systemEvents.emit('product_updated', createdProduct);
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const { name, price, discount, description, images, category, subCategory, stock, sizes, colors, colorVariants, isPublished } = req.body;
  
  import('fs').then(fs => {
    fs.appendFileSync('debug-stock.log', 'UPDATE req.body: ' + JSON.stringify(req.body) + '\n');
  });
  
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      product.name = name || product.name;
      product.price = price !== undefined ? price : product.price;
      product.discount = discount !== undefined ? discount : product.discount;
      product.description = description !== undefined ? description : product.description;
      product.category = category || product.category;
      product.subCategory = subCategory !== undefined ? subCategory : product.subCategory;
      product.stock = stock !== undefined ? stock : product.stock;
      product.sizes = sizes || product.sizes;
      product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
      
      if (colorVariants !== undefined) {
        product.colorVariants = colorVariants;
        
        // Recalculate root stock from sizeVariants (new system)
        if (Array.isArray(colorVariants) && colorVariants.length > 0) {
          product.stock = colorVariants.reduce((total, v) => {
            if (Array.isArray(v.sizeVariants) && v.sizeVariants.length > 0) {
              // New system: sum all sizeVariant stocks
              return total + v.sizeVariants.reduce((s, sv) => s + (Number(sv.stock) || 0), 0);
            }
            // Fallback: old color-level stock field
            return total + (Number(v.stock) || 0);
          }, 0);
        }

        if (!colors || colors.length === 0) {
          product.colors = colorVariants.map(v => v.color).filter(Boolean);
        } else {
          product.colors = colors;
        }
      } else if (colors !== undefined) {
        product.colors = colors;
      }

      if (images !== undefined) {
        product.images = images;
      } else if (colorVariants && colorVariants.length > 0) {
        const variantImages = colorVariants.map(v => v.image).filter(Boolean);
        product.images = [...new Set([...product.images, ...variantImages])];
      }
      
      const updatedProduct = await product.save();
      productEvents.emit('product_updated', updatedProduct);
      systemEvents.emit('product_updated', updatedProduct);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      await Product.deleteOne({ _id: product._id });
      productEvents.emit('product_deleted', product._id);
      systemEvents.emit('product_updated', { _id: product._id, deleted: true });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      const review = {
        user: req.user._id,
        name: req.user.fullName,
        rating: Number(rating),
        comment,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
