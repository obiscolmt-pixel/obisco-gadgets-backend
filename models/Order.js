import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  paystackRef: {
    type: String,
    default: '',
  },
  items: [
    {
      productId: String,
      name: String,
      image: String,
      amount: Number,
      quantity: Number,
      color: String,
      category: String,
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  delivery: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  promoCode: String,
  discount: Number,
  paymentMethod: String,
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)