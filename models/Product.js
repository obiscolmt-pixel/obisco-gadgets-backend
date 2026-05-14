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

  // ── Seller Field ──
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  sellerName: {
    type: String,
    default: 'OBISCO Store',
  },

  featured: {
    type: Boolean,
    default: false,
  },

  hotDeal: {
  type: Boolean,
  default: false,
},

}, { timestamps: true })

export default mongoose.model('Product', productSchema)