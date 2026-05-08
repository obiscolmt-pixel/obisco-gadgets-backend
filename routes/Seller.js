import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Product from '../models/Product.js'
import sendEmail from '../utils/SendEmail.js'

const router = express.Router()

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const verifySellerToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.sellerId = decoded.id
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

// ── REGISTER AS SELLER ──
// POST /api/seller/register
router.post('/register', async (req, res) => {
  const {
    fullName, email, password, phone, whatsapp,
    businessName, businessCategory, businessType,
    businessDescription, businessLocation, businessState,
    socialHandle, experience
  } = req.body

  try {
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const seller = await User.create({
      fullName,
      email,
      phone,
      whatsapp,
      password: hashedPassword,
      role: 'seller',
      sellerStatus: 'pending',
      businessName,
      businessCategory,
      businessType,
      businessDescription,
      businessLocation,
      businessState,
      socialHandle,
      experience,
    })

    // Notify admin
    try {
      await sendEmail({
        to: 'obiscolmt@gmail.com',
        subject: '🏪 New Seller Application — OBISCO Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #111827; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #f97316; margin: 0;">🏪 New Seller Application!</h1>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>👤 Name:</strong> ${fullName}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📧 Email:</strong> ${email}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📱 WhatsApp:</strong> ${whatsapp}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>🏪 Business:</strong> ${businessName}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📦 Category:</strong> ${businessCategory}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📍 Location:</strong> ${businessLocation}, ${businessState}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 4px 0;"><strong>📝 Description:</strong> ${businessDescription}</p>
              <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">Login to your Admin Dashboard to approve or reject this seller.</p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.log('Admin notification failed:', err.message)
    }

    // Email seller
    try {
      await sendEmail({
        to: email,
        subject: '✅ Seller Application Received — OBISCO Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">OBISCO Store</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937;">Application Received! 🎉</h2>
              <p style="color: #6b7280; font-size: 15px;">Hi <strong>${fullName}</strong>, we've received your seller application for <strong>${businessName}</strong>.</p>
              <p style="color: #6b7280; font-size: 15px;">Our team will review your application within 24-48 hours and notify you by email once approved.</p>
              <p style="color: #6b7280; font-size: 15px;">Once approved, you can login to your Seller Dashboard at <a href="https://obisco.store/seller-login" style="color: #f97316;">obisco.store/seller-login</a></p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.log('Seller welcome email failed:', err.message)
    }

    res.status(201).json({ message: 'Seller application submitted successfully!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── SELLER LOGIN ──
// POST /api/seller/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const seller = await User.findOne({ email, role: 'seller' })
    if (!seller) {
      return res.status(400).json({ message: 'No seller account found with this email' })
    }

    if (seller.sellerStatus === 'pending') {
      return res.status(403).json({ message: 'Your application is still under review. Please wait for approval.' })
    }

    if (seller.sellerStatus === 'rejected') {
      return res.status(403).json({ message: 'Your seller application was rejected. Contact support for more information.' })
    }

    const isMatch = await bcrypt.compare(password, seller.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    res.json({
      message: 'Seller login successful!',
      token: generateToken(seller._id),
      seller: {
        id: seller._id,
        fullName: seller.fullName,
        email: seller.email,
        businessName: seller.businessName,
        businessCategory: seller.businessCategory,
        sellerStatus: seller.sellerStatus,
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── GET ALL SELLERS (Admin) ──
// GET /api/seller/all
router.get('/all', async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
    res.json(sellers)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── APPROVE SELLER (Admin) ──
// PUT /api/seller/approve/:id
router.put('/approve/:id', async (req, res) => {
  const { adminPassword } = req.body
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const seller = await User.findByIdAndUpdate(
      req.params.id,
      { sellerStatus: 'approved' },
      { new: true }
    )

    if (!seller) return res.status(404).json({ message: 'Seller not found' })

    // Email seller approval
    try {
      await sendEmail({
        to: seller.email,
        subject: '🎉 Your Seller Account is Approved — OBISCO Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">OBISCO Store</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937;">Congratulations! You're Approved! 🎉</h2>
              <p style="color: #6b7280; font-size: 15px;">Hi <strong>${seller.fullName}</strong>, your seller account for <strong>${seller.businessName}</strong> has been approved!</p>
              <p style="color: #6b7280; font-size: 15px;">You can now login to your Seller Dashboard to start uploading your products.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://obisco.store/seller-login" style="background-color: #f97316; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;">
                  Go to Seller Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.log('Approval email failed:', err.message)
    }

    res.json({ message: 'Seller approved successfully!', seller })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── REJECT SELLER (Admin) ──
// PUT /api/seller/reject/:id
router.put('/reject/:id', async (req, res) => {
  const { adminPassword, reason } = req.body
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const seller = await User.findByIdAndUpdate(
      req.params.id,
      { sellerStatus: 'rejected' },
      { new: true }
    )

    if (!seller) return res.status(404).json({ message: 'Seller not found' })

    // Email seller rejection
    try {
      await sendEmail({
        to: seller.email,
        subject: 'OBISCO Store — Seller Application Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">OBISCO Store</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937;">Application Update</h2>
              <p style="color: #6b7280; font-size: 15px;">Hi <strong>${seller.fullName}</strong>, unfortunately your seller application was not approved at this time.</p>
              ${reason ? `<p style="color: #6b7280; font-size: 15px;"><strong>Reason:</strong> ${reason}</p>` : ''}
              <p style="color: #6b7280; font-size: 15px;">You can contact us on WhatsApp: +234 904 986 3067 for more information.</p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.log('Rejection email failed:', err.message)
    }

    res.json({ message: 'Seller rejected', seller })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── SELLER UPLOAD PRODUCT ──
// POST /api/seller/products
router.post('/products', verifySellerToken, async (req, res) => {
  try {
    const seller = await User.findById(req.sellerId)
    if (!seller || seller.role !== 'seller' || seller.sellerStatus !== 'approved') {
      return res.status(403).json({ message: 'Not authorized as approved seller' })
    }

    const { name, department, category, image, price, amount, description, inStock, colors } = req.body

    const product = await Product.create({
      name, department, category, image, price, amount,
      description, inStock, colors,
      seller: seller._id,
      sellerName: seller.businessName || seller.fullName,
    })

    res.status(201).json({ message: 'Product uploaded successfully!', product })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── SELLER GET OWN PRODUCTS ──
// GET /api/seller/products
router.get('/products', verifySellerToken, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.sellerId }).sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── SELLER UPDATE PRODUCT ──
// PUT /api/seller/products/:id
router.put('/products/:id', verifySellerToken, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.sellerId })
    if (!product) return res.status(404).json({ message: 'Product not found or not yours' })

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ message: 'Product updated!', product: updated })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── SELLER DELETE PRODUCT ──
// DELETE /api/seller/products/:id
router.delete('/products/:id', verifySellerToken, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.sellerId })
    if (!product) return res.status(404).json({ message: 'Product not found or not yours' })

    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Product deleted!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ── SELLER PROFILE ──
// GET /api/seller/profile
router.get('/profile', verifySellerToken, async (req, res) => {
  try {
    const seller = await User.findById(req.sellerId).select('-password')
    res.json(seller)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router
