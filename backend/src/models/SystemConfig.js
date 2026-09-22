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
  },
  aboutPage: {
    heroTitle: { type: String, default: 'About Next-Gen' },
    heroDescription: { type: String, default: 'We believe that style is a way to say who you are without having to speak. Our mission is to provide premium, accessible fashion for both men and women, tailored for perfection.' },
    heroImage: { type: String, default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000' },
    valuesTitle: { type: String, default: 'Why Shop With Us?' },
    valuesDescription: { type: String, default: 'We are dedicated to providing the best shopping experience possible, focusing on quality, sustainability, and outstanding customer service.' },
    values: {
      type: [{
        icon: { type: String, default: 'HeartHandshake' },
        title: { type: String, required: true },
        description: { type: String, required: true }
      }],
      default: [
        { icon: 'Truck', title: 'Fast Delivery', description: 'Partnered with Vireak Buntham and J&T Express for rapid nationwide delivery.' },
        { icon: 'ShieldCheck', title: 'Secure Payments', description: '100% secure payments using Bakong KHQR, the national standard.' },
        { icon: 'RotateCcw', title: 'Easy Returns', description: 'Not happy? Return your items within 30 days for a full refund.' },
        { icon: 'HeartHandshake', title: 'Quality Support', description: 'Our team is available 24/7 to help you with any questions or issues.' }
      ]
    }
  },
  announcementBanner: { type: String, default: '' }
}, { timestamps: true });

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
