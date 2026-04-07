import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['starter', 'main', 'dessert', 'beverage']
  },
  image: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  prepTime: Number, // minutes
  calories: Number,
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot']
  }
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
