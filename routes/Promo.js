import express from 'express'
import PromoCode from '../models/PromoCode.js'

const router = express.Router()

// @route POST /api/promo/validate — validate a promo code
router.post('/validate', async (req, res) => {
  const { code, orderTotal } = req.body

  try {
    const promo = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    })

    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code.' })
    }

    // Check expiry
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.status(400).json({ message: 'This promo code has expired.' })
    }

    // Check max uses
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: 'This promo code has reached its usage limit.' })
    }

    // Check minimum order
    if (orderTotal < promo.minOrder) {
      return res.status(400).json({
        message: `Minimum order of ₦${promo.minOrder.toLocaleString()} required for this code.`
      })
    }

    // Calculate discount
    let discount = 0
    if (promo.type === 'percentage') {
      discount = Math.round((orderTotal * promo.value) / 100)
    } else {
      discount = promo.value
    }

    res.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount,
      message: promo.type === 'percentage'
        ? `${promo.value}% discount applied!`
        : `₦${promo.value.toLocaleString()} discount applied!`
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/promo/use — mark promo code as used after order
router.post('/use', async (req, res) => {
  const { code } = req.body
  try {
    await PromoCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } }
    )
    res.json({ message: 'Promo code usage recorded.' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/promo/create — create a new promo code (admin)
router.post('/create', async (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt } = req.body
  try {
    const promo = await PromoCode.create({
      code: code.toUpperCase().trim(),
      type,
      value,
      minOrder: minOrder || 0,
      maxUses: maxUses || null,
      expiresAt: expiresAt || null,
    })
    res.status(201).json({ message: 'Promo code created!', promo })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Promo code already exists.' })
    }
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route GET /api/promo — get all promo codes (admin)
router.get('/', async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 })
    res.json(promos)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route DELETE /api/promo/:id — delete a promo code (admin)
router.delete('/:id', async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id)
    res.json({ message: 'Promo code deleted!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router