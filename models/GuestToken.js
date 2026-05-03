import mongoose from 'mongoose'

const guestTokenSchema = new mongoose.Schema({
  fcmToken: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('GuestToken', guestTokenSchema)