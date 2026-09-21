import ShippingMethod from '../models/ShippingMethod.js';
import { systemEvents } from '../events/systemEvents.js';

// @desc  Get all shipping methods (public)
// @route GET /api/shipping
export const getShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find({}).sort({ createdAt: 1 });
    res.json(methods);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc  Get active shipping methods only (for checkout)
// @route GET /api/shipping/active
export const getActiveShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find({ isActive: true }).sort({ price: 1 });
    res.json(methods);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc  Create shipping method
// @route POST /api/shipping
export const createShippingMethod = async (req, res) => {
  try {
    const { name, description, price, estimatedDays, isActive, icon } = req.body;
    const method = await ShippingMethod.create({
      name, description, price, estimatedDays,
      isActive: isActive !== undefined ? isActive : true,
      icon: icon || '🚚'
    });
    systemEvents.emit('shipping_updated', method);
    res.status(201).json(method);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc  Update shipping method
// @route PUT /api/shipping/:id
export const updateShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: 'Shipping method not found' });

    const { name, description, price, estimatedDays, isActive, icon } = req.body;
    method.name          = name          ?? method.name;
    method.description   = description   ?? method.description;
    method.price         = price         ?? method.price;
    method.estimatedDays = estimatedDays ?? method.estimatedDays;
    method.isActive      = isActive      ?? method.isActive;
    method.icon          = icon          ?? method.icon;

    const updated = await method.save();
    systemEvents.emit('shipping_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc  Delete shipping method
// @route DELETE /api/shipping/:id
export const deleteShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: 'Shipping method not found' });
    await method.deleteOne();
    systemEvents.emit('shipping_updated', { _id: method._id, deleted: true });
    res.json({ message: 'Shipping method removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc  Toggle active status
// @route PATCH /api/shipping/:id/toggle
export const toggleShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: 'Shipping method not found' });
    method.isActive = !method.isActive;
    const updated = await method.save();
    systemEvents.emit('shipping_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
