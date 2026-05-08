import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: false,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  fcmToken: {
    type: String,
    default: null,
  },

  // ── Seller Fields ──
  role: {
    type: String,
    enum: ['customer', 'seller', 'admin'],
    default: 'customer',
  },
  sellerStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  businessName: {
    type: String,
    default: '',
  },
  businessCategory: {
    type: String,
    default: '',
  },
  businessType: {
    type: String,
    default: '',
  },
  businessDescription: {
    type: String,
    default: '',
  },
  businessLocation: {
    type: String,
    default: '',
  },
  businessState: {
    type: String,
    default: '',
  },
  whatsapp: {
    type: String,
    default: '',
  },
  socialHandle: {
    type: String,
    default: '',
  },
  experience: {
    type: String,
    default: '',
  },

}, { timestamps: true })

export default mongoose.model('User', userSchema)