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
  }

  
}, { timestamps: true })

export default mongoose.model('User', userSchema)