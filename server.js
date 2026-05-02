import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/Auth.js'
import productRoutes from './routes/Products.js'
import orderRoutes from './routes/Orders.js'
import reviewRoutes from './routes/Reviews.js'
import chatRoutes from './routes/Chat.js'
import promoRoutes from './routes/Promo.js'
import businessRegRoutes from './routes/BusinessReg.js'
import broadcastRoutes from './routes/Broadcast.js'
import vtuRoutes from './routes/VTU.js';
import cookieParser from 'cookie-parser'
import cookieRoutes from './routes/Cookies.js'


dotenv.config()

const app = express()

// ✅ CORS — allow all origins
app.use(cors({
  origin: true,
  credentials: true
}))

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true)
//     if (origin.endsWith('.vercel.app')) return callback(null, true)
//     if (allowedOrigins.includes(origin)) return callback(null, true)
//     return callback(null, true)
//   },
//   credentials: true
// }))

// Middleware
app.use(express.json())
app.use(cookieParser())

// General rate limit — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please try again later.' }
})

// Strict limit for auth routes — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' }
})

app.use(limiter)
app.use('/api/auth', authLimiter)


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/promo', promoRoutes)
app.use('/api/business', businessRegRoutes)
app.use('/api/broadcast', broadcastRoutes)
app.use('/api/vtu', vtuRoutes);
app.use('/api/cookies', cookieRoutes)


// Test route
app.get('/', (req, res) => {
  res.json({ message: 'OBISCO Gadgets API is running!' })
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
