import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { systemEvents } from '../events/systemEvents.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
    deliveryCompany,
    // Top-level form fields (also accepted for backwards compat)
    fullName,
    phone,
    telegramUsername,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    // Merge top-level contact fields into shippingAddress if needed
    const resolvedAddress = {
      ...shippingAddress,
      fullName: shippingAddress?.fullName || fullName || '',
      phone: shippingAddress?.phone || phone || '',
      telegramUsername: shippingAddress?.telegramUsername || telegramUsername || '',
    };

    // Check stock availability
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });

      let availableStock = product.stock || 0;
      const cColor = item.color || (product.colors && product.colors[0]);
      const cSize = item.size || (product.sizes && product.sizes[0]);

      if (cColor && product.colorVariants) {
        const variant = product.colorVariants.find(v => v.color.toLowerCase() === cColor.toLowerCase());
        if (variant) {
          if (variant.sizeVariants && cSize) {
            const sv = variant.sizeVariants.find(s => s.size === cSize);
            if (sv) availableStock = sv.stock;
          } else if (variant.stock !== undefined) {
            availableStock = variant.stock;
          }
        }
      }

      if (item.qty > availableStock) {
        return res.status(400).json({ message: `Not enough stock for ${item.name} (${item.color || ''} ${item.size || ''}). Only ${availableStock} left.` });
      }
    }

    const order = new Order({
      orderItems: orderItems.map(item => ({
        ...item,
        image: item.image || 'https://via.placeholder.com/150',
      })),
      user: req.user._id,
      shippingAddress: resolvedAddress,
      paymentMethod: paymentMethod || 'bakong',
      itemsPrice,
      shippingPrice,
      totalPrice,
      deliveryCompany: deliveryCompany || shippingAddress?.deliveryCompany || '',
    });

    const createdOrder = await order.save();
    systemEvents.emit('order_updated', createdOrder);
    
    // Increment sales count for each product in the order
    for (const item of createdOrder.orderItems) {
      if (item.product) {
        const updatedProduct = await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.qty } }, { new: true });
        if (updatedProduct) {
          systemEvents.emit('product_updated', updatedProduct);
        }
      }
    }
    
    await Notification.create({
      user: req.user._id,
      title: 'Order Placed Successfully',
      message: 'Your order has been placed and is waiting for processing.',
      type: 'order',
      link: '/profile'
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Create Order Error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      systemEvents.emit('order_updated', updatedOrder);
      
      await Notification.create({
        user: order.user,
        title: 'Order Delivered',
        message: 'Your order has been marked as delivered. Enjoy!',
        type: 'success',
        link: '/profile'
      });

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id fullName image');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update order to paid (Bakong Verification)
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
      };

      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          const cColor = item.color || (product.colors && product.colors[0]);
          const cSize = item.size || (product.sizes && product.sizes[0]);

          if (cColor && product.colorVariants) {
            const variant = product.colorVariants.find(v => v.color.toLowerCase() === cColor.toLowerCase());
            if (variant) {
              if (variant.sizeVariants && cSize) {
                const sv = variant.sizeVariants.find(s => s.size === cSize);
                if (sv) sv.stock = Math.max(0, sv.stock - item.qty);
              } else if (variant.stock !== undefined) {
                variant.stock = Math.max(0, variant.stock - item.qty);
              }
            }
          }
          product.stock = Math.max(0, product.stock - item.qty);

          if (product.colorVariants && product.colorVariants.length > 0) {
            product.stock = product.colorVariants.reduce((total, v) => {
              if (v.sizeVariants && v.sizeVariants.length > 0) {
                return total + v.sizeVariants.reduce((s, sv) => s + (Number(sv.stock) || 0), 0);
              }
              return total + (Number(v.stock) || 0);
            }, 0);
          }
          
          await product.save();
          import('../events/systemEvents.js').then(({ systemEvents }) => systemEvents.emit('product_updated', product));
        }
      }

      const updatedOrder = await order.save();
      systemEvents.emit('order_updated', updatedOrder);

      await Notification.create({
        user: order.user,
        title: 'Payment Confirmed',
        message: 'Your Bakong payment has been successfully verified.',
        type: 'success',
        link: '/profile'
      });

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
