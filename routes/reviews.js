import express from 'express'
import Review from '../models/Review.js'
import protect from '../middleware/auth.js'

const router = express.Router()

// @route GET /api/reviews/:productId — get all reviews for a product
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .sort({ createdAt: -1 })

    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0

    res.json({
      reviews,
      avgRating: avgRating.toFixed(1),
      total: reviews.length
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/reviews/:productId — add a review (protected)
router.post('/:productId', protect, async (req, res) => {
  const { rating, comment, fullName } = req.body

  try {
    // Check if user already reviewed this product
    const existing = await Review.findOne({
      product: req.params.productId,
      user: req.user.id,
    })

    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product.' })
    }

    const review = await Review.create({
      product: req.params.productId,
      user: req.user.id,
      fullName,
      rating,
      comment,
    })

    res.status(201).json({ message: 'Review added!', review })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route DELETE /api/reviews/:id — delete a review (admin)
router.delete('/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id)
    res.json({ message: 'Review deleted!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router