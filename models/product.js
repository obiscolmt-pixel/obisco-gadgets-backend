import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['phones', 'laptops', 'headphones', 'chargers', 'speakers', 'tablets'],
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
    enum: ['$', '$$', '$$$', '$$$$'],
  },
  amount: {
    type: Number,
    required: true,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  colors: [
    {
      name: { type: String },
      image: { type: String },
    }
  ],

}, { timestamps: true })

export default mongoose.model('Product', productSchema)