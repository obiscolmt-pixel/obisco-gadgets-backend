import express from 'express'
import sendEmail from '../utils/SendEmail.js'

const router = express.Router()

router.post('/register-business', async (req, res) => {
  const { ownerName, businessName, category, businessType, phone, whatsapp, email, location, state, description, instagram, experience } = req.body

  try {
    await sendEmail({
      to: 'obiscostore1@gmail.com',
      subject: `🏪 New Business Registration — ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🏪 New Business Registration</h1>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Business Name</p>
              <p style="color: #f97316; font-size: 22px; font-weight: 900; margin: 0;">${businessName}</p>
            </div>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>👤 Owner:</strong> ${ownerName}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>📦 Category:</strong> ${category}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>🔖 Business Type:</strong> ${businessType || 'N/A'}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>📱 Phone:</strong> ${phone}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>💬 WhatsApp:</strong> ${whatsapp || phone}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>📧 Email:</strong> ${email}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>📍 Location:</strong> ${location}, ${state}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>📝 Description:</strong> ${description || 'N/A'}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>📸 Instagram:</strong> ${instagram || 'N/A'}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 6px 0;"><strong>⏳ Experience:</strong> ${experience || 'N/A'}</p>
            </div>
          </div>
          <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Store • Lagos, Nigeria</p>
          </div>
        </div>
      `,
    })

    res.json({ message: 'Application submitted successfully!' })
  } catch (err) {
    console.log('Business reg error:', err.message)
    res.status(500).json({ message: 'Failed to send application' })
  }
})

export default router



