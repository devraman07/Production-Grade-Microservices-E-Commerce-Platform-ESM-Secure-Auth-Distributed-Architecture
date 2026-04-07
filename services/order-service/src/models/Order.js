import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  menuItemId: mongoose.Schema.Types.ObjectId,
  type: {
    type: String,
    enum: ['product', 'menu'],
    required: true
  },
  name: String,
  image: String,
  price: Number,
  quantity: Number,
  restaurantId: mongoose.Schema.Types.ObjectId
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'cod', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    transactionId: String,
    amount: Number
  },
  subtotal: Number,
  tax: Number,
  shipping: Number,
  discount: Number,
  totalAmount: Number,
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'preparing', 
      'out-for-delivery', 'delivered', 'cancelled'
    ],
    default: 'pending'
  },
  delivery: {
    estimatedTime: String,
    assignedTo: mongoose.Schema.Types.ObjectId,
    trackingUrl: String
  },
  notes: String
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 }); // User order history
orderSchema.index({ orderNumber: 1 }, { unique: true }); // Unique order lookup
orderSchema.index({ userId: 1, status: 1, createdAt: -1 }); // Pending order check
orderSchema.index({ status: 1, createdAt: -1 }); // Admin order management

export default mongoose.model('Order', orderSchema);
