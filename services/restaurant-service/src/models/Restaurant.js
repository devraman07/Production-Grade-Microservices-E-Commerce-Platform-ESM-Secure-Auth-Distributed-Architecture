import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  cuisine: [String],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  deliveryTime: {
    min: Number,
    max: Number
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  minOrder: {
    type: Number,
    default: 0
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  image: String,
  banner: String
}, { timestamps: true });

restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: 1 });

export default mongoose.model('Restaurant', restaurantSchema);
