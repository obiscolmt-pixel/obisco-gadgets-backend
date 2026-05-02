import express from 'express'
import admin from 'firebase-admin'
import { createRequire } from 'module'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const require = createRequire(import.meta.url)
const path = process.env.NODE_ENV === 'production' 
  ? '/etc/secrets/serviceAccountKey.json'
  : '../serviceAccountKey.json'
const serviceAccount = require(path)

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const router = express.Router()

// Save FCM token
// Save FCM token
router.post('/save-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ message: 'Token required' })

    // Try to find logged in user from JWT cookie
    const authHeader = req.headers.authorization
    const cookieToken = req.cookies?.token

    let userId = null

    if (authHeader || cookieToken) {
      try {
        const jwtToken = authHeader?.replace('Bearer ', '') || cookieToken
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET)
        userId = decoded.id
      } catch (e) {
        // Not logged in, that's fine
      }
    }

    if (userId) {
      // Save to logged in user
      await User.findByIdAndUpdate(userId, { fcmToken: token })
    } else {
      // Save as guest — find existing guest or create one
      await User.findOneAndUpdate(
        { fcmToken: token },
        { fcmToken: token },
        { upsert: true, new: true }
      )
    }

    res.json({ message: 'Token saved' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Send push notification to all users (admin only)
router.post('/send', async (req, res) => {
  try {
    const { title, body, adminPassword } = req.body

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const users = await User.find({ fcmToken: { $exists: true, $ne: null } })
    const tokens = users.map(u => u.fcmToken).filter(Boolean)

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'No users with notifications enabled' })
    }

    const message = {
      notification: { title, body },
      tokens
    }

    const response = await admin.messaging().sendEachForMulticast(message)
    res.json({
      message: 'Notifications sent!',
      successCount: response.successCount,
      failureCount: response.failureCount
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router