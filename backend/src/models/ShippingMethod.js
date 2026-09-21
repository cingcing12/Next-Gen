import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  estimatedDays: { type: String, default: '' }, // e.g. "1-2 days"
  isActive: { type: Boolean, default: true },
  icon: { type: String, default: '🚚' },         // emoji or icon name
}, { timestamps: true });

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
export default ShippingMethod;
