import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['card', 'cod', 'wallet', 'upi'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  gateway: {
    type: String,
    default: 'mock-gateway'
  },
  gatewayTransactionId: {
    type: String,
    unique: true
  },
  cardLast4: String,
  paymentMethodId: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

export default mongoose.model('Transaction', transactionSchema);
