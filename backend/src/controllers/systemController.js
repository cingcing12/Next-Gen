import { systemEvents } from '../events/systemEvents.js';

// @desc    SSE stream for system-wide updates (categories, orders, shipping, user status)
// @route   GET /api/system/stream
// @access  Public
export const streamSystem = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Generic handler for various events
  const handleCategoryUpdated = (data) => sendEvent('category_updated', data);
  const handleProductUpdated = (data) => sendEvent('product_updated', data);
  const handleOrderUpdated = (data) => sendEvent('order_updated', data);
  const handleShippingUpdated = (data) => sendEvent('shipping_updated', data);
  const handleUserBlocked = (data) => sendEvent('user_blocked', data);
  const handleUserUpdated = (data) => sendEvent('user_updated', data);
  const handleConfigUpdated = (data) => sendEvent('config_updated', data);

  systemEvents.on('category_updated', handleCategoryUpdated);
  systemEvents.on('product_updated', handleProductUpdated);
  systemEvents.on('order_updated', handleOrderUpdated);
  systemEvents.on('shipping_updated', handleShippingUpdated);
  systemEvents.on('user_blocked', handleUserBlocked);
  systemEvents.on('user_updated', handleUserUpdated);
  systemEvents.on('config_updated', handleConfigUpdated);

  req.on('close', () => {
    systemEvents.off('category_updated', handleCategoryUpdated);
    systemEvents.off('product_updated', handleProductUpdated);
    systemEvents.off('order_updated', handleOrderUpdated);
    systemEvents.off('shipping_updated', handleShippingUpdated);
    systemEvents.off('user_blocked', handleUserBlocked);
    systemEvents.off('user_updated', handleUserUpdated);
    systemEvents.off('config_updated', handleConfigUpdated);
  });
};

import SystemConfig from '../models/SystemConfig.js';

// @desc    Get system configuration
// @route   GET /api/system/config
// @access  Public
export const getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne().populate('featuredProducts');
    
    if (!config) {
      config = await SystemConfig.create({});
      config = await SystemConfig.findOne().populate('featuredProducts');
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get system configuration', error: error.message });
  }
};

// @desc    Update system configuration
// @route   PUT /api/system/config
// @access  Private/Admin
export const updateSystemConfig = async (req, res) => {
  try {
    const { homeSlider, featuredProducts, featuredProductCount, aboutShop } = req.body;

    let config = await SystemConfig.findOne();

    if (!config) {
      config = new SystemConfig();
    }

    if (homeSlider) config.homeSlider = homeSlider;
    if (featuredProducts) config.featuredProducts = featuredProducts;
    if (featuredProductCount !== undefined) config.featuredProductCount = featuredProductCount;
    if (aboutShop) config.aboutShop = aboutShop;

    const updatedConfig = await config.save();
    
    // Optionally notify connected clients
    systemEvents.emit('config_updated', updatedConfig);

    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update system configuration', error: error.message });
  }
};
