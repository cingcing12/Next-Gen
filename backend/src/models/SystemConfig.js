import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  highlight: { type: String, required: true },
  description: { type: String, required: true },
});

const systemConfigSchema = new mongoose.Schema({
  homeSlider: {
    type: [slideSchema],
    default: [
      {
        image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2070',
        title: 'Redefine Your',
        highlight: 'Style With Us',
        description: 'Discover premium quality clothing for men and women. Designed for comfort, tailored for perfection.'
      },
      {
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2070',
        title: 'Autumn Collection',
        highlight: 'New Arrivals',
        description: 'Embrace the season with our latest exclusive designs. Stay warm, look cool.'
      },
      {
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2070',
        title: 'Elevate Everyday',
        highlight: 'Essentials',
        description: 'Shop our curated collection of timeless wardrobe staples.'
      }
    ]
  },
  featuredProductCount: { type: Number, default: 4 },
  featuredProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  aboutShop: {
    title: { type: String, default: 'About Our Shop' },
    description: { 
      type: String, 
      default: 'Next-Gen was born out of a desire to create clothing that looks good and feels incredible. We use sustainable materials and ethical manufacturing to bring you the best in modern fashion.' 
    },
    image: { type: String, default: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=2070' },
  }
}, { timestamps: true });

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
