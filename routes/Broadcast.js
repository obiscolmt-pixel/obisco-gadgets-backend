import express from 'express'
import User from '../models/User.js'
import sendEmail from '../utils/SendEmail.js'

const router = express.Router()

router.post('/send', async (req, res) => {
  const { subject, message, adminPassword } = req.body

  // Verify admin password
  if (adminPassword !== 'obisco2025') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const users = await User.find({ email: { $exists: true } })
    const emails = users.map((u) => u.email).filter(Boolean)

    if (emails.length === 0) {
      return res.status(400).json({ message: 'No users found.' })
    }

    let sent = 0
    let failed = 0

    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">OBISCO Store</h1>
              </div>
              <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <div style="white-space: pre-line; color: #374151; font-size: 15px; line-height: 1.8;">
                  ${message}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://obisco.store" style="background-color: #f97316; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;">
                    Shop Now at OBISCO Store
                  </a>
                </div>
              </div>
              <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Store • Lagos, Nigeria</p>
                <p style="color: #6b7280; font-size: 11px; margin: 6px 0 0 0;">WhatsApp: +234 904 986 3067</p>
              </div>
            </div>
          `,
        })
        sent++
      } catch (err) {
        failed++
        console.log(`Failed to send to ${email}:`, err.message)
      }
    }

    res.json({
      message: `Broadcast complete! Sent: ${sent}, Failed: ${failed}`,
      sent,
      failed,
      total: emails.length,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router