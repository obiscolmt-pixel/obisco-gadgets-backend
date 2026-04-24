import express from 'express'
import Product from '../models/Product.js'

const router = express.Router()

// @route GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/products/seed — seed products from data.js
router.post('/seed', async (req, res) => {
  try {
    await Product.deleteMany()
    const products = await Product.insertMany(req.body)
    res.json({ message: `${products.length} products seeded!` })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route POST /api/products/add — add new products without deleting
router.post('/add', async (req, res) => {
  try {
    const products = await Product.insertMany(req.body)
    res.json({ message: `${products.length} products added!` })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})


router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json({ message: 'Product updated!', product })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json({ message: 'Product deleted!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router