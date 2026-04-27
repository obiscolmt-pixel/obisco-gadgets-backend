import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'

import authRoutes from './routes/Auth.js'
import productRoutes from './routes/Products.js'
import orderRoutes from './routes/Orders.js'
import reviewRoutes from './routes/Reviews.js'
import chatRoutes from './routes/Chat.js'
import promoRoutes from './routes/Promo.js'
import businessRegRoutes from './routes/BusinessReg.js'
import broadcastRoutes from './routes/Broadcast.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/promo', promoRoutes)
app.use('/api/business', businessRegRoutes)
app.use('/api/broadcast', broadcastRoutes)


// Test route
app.get('/', (req, res) => {
  res.json({ message: 'OBISCO Gadgets API is running!' })
})

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected!')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch((err) => {
    console.log('❌ MongoDB connection error:', err.message)
  })


  // Admin verify route
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true })
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' })
  }
})