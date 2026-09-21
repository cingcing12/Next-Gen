import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      default: 'info', // 'info', 'success', 'warning', 'order'
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    link: {
      type: String, // Optional URL to navigate to when clicked (e.g., /profile)
    }
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
