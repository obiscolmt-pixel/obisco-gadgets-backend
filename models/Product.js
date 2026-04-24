import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    enum: ['gadgets', 'fashion', 'lifestyle'],
    default: 'gadgets',
  },
  category: {
    type: String,
    required: true,
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
  description: {
    type: String,
    default: '',
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