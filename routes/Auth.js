import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import sendEmail from '../utils/SendEmail.js'

const router = express.Router()

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
    })

    // Send welcome email
    await sendEmail({
      to: email,
      subject: '🎉 Welcome to OBISCO Gadgets!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">OBISCO <span style="font-weight: 300;">gadgets</span></h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937;">Welcome, ${fullName}! 🎉</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
              Thank you for creating an account with <strong>OBISCO Gadgets</strong>. We're excited to have you on board!
            </p>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
              You can now browse our latest gadgets, add items to your cart, and enjoy fast delivery across Nigeria.
            </p>
            <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #c2410c; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">YOUR ACCOUNT DETAILS</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>Name:</strong> ${fullName}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>Email:</strong> ${email}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>Phone:</strong> ${phone}</p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:5173" style="background-color: #f97316; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;">
                Start Shopping Now
              </a>
            </div>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 20px;">
              <p style="color: #374151; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">💳 PAYMENT METHODS WE ACCEPT</p>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">🏦 Fidelity Bank — 6315564573 (Ariogba Patrick Obinna)</p>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">📱 OPay — 9049863067 (Ariogba Patrick Obinna)</p>
            </div>
          </div>
          <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Gadgets • Lagos, Nigeria</p>
            <p style="color: #6b7280; font-size: 11px; margin: 6px 0 0 0;">Questions? Contact us on WhatsApp: +234 904 986 3067</p>
          </div>
        </div>
      `,
    })

    res.status(201).json({
      message: 'Account created successfully!',
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    res.json({
      message: 'Signed in successfully!',
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/auth/forgot-password — sends 6 digit code
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' })
    }

    // Generate 6 digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    user.resetPasswordToken = resetCode
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Send code email
    await sendEmail({
      to: email,
      subject: '🔐 Your OBISCO Gadgets Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">OBISCO <span style="font-weight: 300;">gadgets</span></h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; font-size: 22px;">Password Reset Code 🔐</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
              Hi <strong>${user.fullName}</strong>, use the code below to reset your password.
            </p>

            <!-- Code Box -->
            <div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">Your Reset Code</p>
              <p style="color: #f97316; font-size: 48px; font-weight: 900; letter-spacing: 12px; margin: 0;">${resetCode}</p>
            </div>

            <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px; margin: 20px 0;">
              <p style="color: #c2410c; font-size: 13px; margin: 0;">
                ⚠️ This code expires in <strong>1 hour</strong>. 
                If you did not request this, please ignore this email.
              </p>
            </div>
          </div>
          <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Gadgets • Lagos, Nigeria</p>
            <p style="color: #6b7280; font-size: 11px; margin: 6px 0 0 0;">Questions? WhatsApp: +234 904 986 3067</p>
          </div>
        </div>
      `,
    })

    res.json({ message: 'Reset code sent! Check your email.' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/auth/reset-password — verify code and reset
router.post('/reset-password', async (req, res) => {
  const { email, code, password } = req.body

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' })
    }

    // Update password
    user.password = await bcrypt.hash(password, 10)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: '✅ Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">OBISCO gadgets</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937;">Password Changed ✅</h2>
            <p style="color: #6b7280; font-size: 15px;">
              Hi <strong>${user.fullName}</strong>, your password has been successfully changed. You can now sign in with your new password.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:5173" style="background-color: #f97316; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold;">
                Sign In Now
              </a>
            </div>
            <p style="color: #ef4444; font-size: 13px; text-align: center;">
              If you did not make this change, contact us immediately on WhatsApp: +234 904 986 3067
            </p>
          </div>
          <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Gadgets</p>
          </div>
        </div>
      `,
    })

    res.json({ message: 'Password reset successful! You can now sign in.' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})


// Notify admin of new signup
try {
  await sendEmail({
    to: 'obiscolmt@gmail.com',
    subject: `👤 New Customer Signup — OBISCO Gadgets`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #111827; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #f97316; margin: 0; font-size: 24px;">👤 New Customer!</h1>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">New Registration</p>
            <p style="color: #f97316; font-size: 22px; font-weight: 900; margin: 0;">${fullName}</p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
            <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📛 Name:</strong> ${fullName}</p>
            <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📧 Email:</strong> ${email}</p>
            <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📱 Phone:</strong> ${phone || 'Not provided'}</p>
            <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📅 Joined:</strong> ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

        </div>
      </div>
    `,
  })
  console.log('✅ Admin notified of new signup')
} catch (adminEmailErr) {
  console.log('⚠️ Admin signup notification failed:', adminEmailErr.message)
}

export default router