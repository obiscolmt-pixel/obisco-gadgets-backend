import express from 'express'
import crypto from 'crypto'
import Order from '../models/Order.js'

const router = express.Router()

// Initialize Paystack transaction
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, orderId, metadata } = req.body

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack uses kobo
        reference: orderId,
        metadata,
        callback_url: 'https://www.obisco.store'
      })
    })

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Paystack init error:', err.message)
    res.status(500).json({ message: 'Payment initialization failed' })
  }
})

// Verify Paystack transaction
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    })

    const data = await response.json()

    if (data.data?.status === 'success') {
      // Update order payment status
      await Order.findByIdAndUpdate(reference, { paymentStatus: 'paid' })
    }

    res.json(data)
  } catch (err) {
    console.error('Paystack verify error:', err.message)
    res.status(500).json({ message: 'Payment verification failed' })
  }
})

// Webhook - Paystack notifies us of payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Unauthorized')
    }

    const event = JSON.parse(req.body)

    if (event.event === 'charge.success') {
      const reference = event.data.reference
      await Order.findByIdAndUpdate(reference, { paymentStatus: 'paid' })
      console.log('✅ Payment confirmed via webhook:', reference)
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Webhook error:', err.message)
    res.sendStatus(500)
  }
})

export default router