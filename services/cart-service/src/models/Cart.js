import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.type === 'product'; }
  },
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.type === 'menu'; }
  },
  type: {
    type: String,
    enum: ['product', 'menu'],
    required: true
  },
  name: String,
  image: String,
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId // For menu items
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    sparse: true, // Allow multiple docs for same user during merge
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient cart lookups
cartSchema.index({ userId: 1, updatedAt: -1 });
cartSchema.index({ sessionId: 1, updatedAt: -1 });

export default mongoose.model('Cart', cartSchema);
