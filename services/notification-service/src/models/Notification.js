import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'delivery', 'promotion'],
    required: true
  },
  title: String,
  message: String,
  data: mongoose.Schema.Types.Mixed,
  channels: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    provider: String,
    providerId: String
  }],
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);
