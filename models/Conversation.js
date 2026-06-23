import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    default: 'Customer'
  },
  messages: [messageSchema],
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'escalated', 'resolved'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);