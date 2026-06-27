import express from 'express'
import crypto from 'crypto'
import Order from '../models/Order.js'
import Wallet from '../models/wallet.js'
import WalletTransaction from '../models/walletTransaction.js'

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
        amount: amount * 100,
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
      await Order.findOneAndUpdate(
        { paystackRef: reference },
        { paymentStatus: 'paid' }
      )
    }

    res.json(data)
  } catch (err) {
    console.error('Paystack verify error:', err.message)
    res.status(500).json({ message: 'Payment verification failed' })
  }
})

// Webhook
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
      const metadata = event.data.metadata

      // ── Wallet funding ──
      if (metadata?.type === 'wallet_funding') {
        const userId = metadata.userId
        const amount = event.data.amount / 100

        let wallet = await Wallet.findOne({ user: userId })
        if (!wallet) {
          wallet = await Wallet.create({ user: userId, balance: 0 })
        }

        wallet.balance += amount
        await wallet.save()

        await WalletTransaction.create({
          user: userId,
          type: 'credit',
          amount,
          description: `Wallet funded via Paystack`,
          reference,
          status: 'success'
        })

        console.log(`✅ Wallet credited ₦${amount} for user ${userId}`)
      } else {
        // ── Regular order payment ──
        await Order.findOneAndUpdate(
          { paystackRef: reference },
          { paymentStatus: 'paid' }
        )
        console.log('✅ Order payment confirmed via webhook:', reference)
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Webhook error:', err.message)
    res.sendStatus(500)
  }
})

export default router