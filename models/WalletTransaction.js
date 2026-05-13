import mongoose from 'mongoose'

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  }
}, { timestamps: true })

export default mongoose.model('WalletTransaction', walletTransactionSchema)