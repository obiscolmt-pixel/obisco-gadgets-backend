import express from 'express'
import User from '../models/User.js'
import sendEmail from '../utils/SendEmail.js'

const router = express.Router()

const verifyAdmin = (req, res) => {
  const { adminPassword } = req.body
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Unauthorized' })
    return false
  }
  return true
}

// ── Broadcast Email ──
router.post('/broadcast-email', async (req, res) => {
  if (!verifyAdmin(req, res)) return
  const { subject, message } = req.body
  try {
    const users = await User.find({ email: { $exists: true, $ne: '' } })
    const results = await Promise.allSettled(
      users.map(user =>
        sendEmail({
          to: user.email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f97316; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">OBISCO STORE</h1>
                <p style="color: #fff7ed; margin: 4px 0 0; font-size: 13px;">Your one-stop shop in Nigeria</p>
              </div>
              <div style="padding: 30px; background: #fff;">
                <p style="color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-line;">${message}</p>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                <a href="https://obisco.store" style="background: #f97316; color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold;">Visit Obisco Store</a>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 16px;">You're receiving this because you signed up on Obisco Store.</p>
              </div>
            </div>
          `
        })
      )
    )
    const sent = results.filter(r => r.status === 'fulfilled').length
    res.json({ message: `Email sent to ${sent} of ${users.length} users` })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── Broadcast SMS ──
router.post('/broadcast-sms', async (req, res) => {
  if (!verifyAdmin(req, res)) return
  const { message } = req.body
  try {
    const users = await User.find({ phone: { $exists: true, $ne: '' } })
    if (users.length === 0) return res.json({ message: 'No users with phone numbers found' })

    const results = await Promise.allSettled(
      users.map(user =>
        fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.phone,
            from: 'Obisco',
            sms: message,
            type: 'plain',
            api_key: process.env.TERMII_API_KEY,
            channel: 'generic'
          })
        })
      )
    )
    const sent = results.filter(r => r.status === 'fulfilled').length
    res.json({ message: `SMS sent to ${sent} of ${users.length} users` })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router