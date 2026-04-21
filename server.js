import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import reviewRoutes from './routes/reviews.js'
import chatRoutes from './routes/chat.js'
import promoRoutes from './routes/promo.js'

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