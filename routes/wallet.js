import express from 'express'
import protect from '../middleware/auth.js'
import Wallet from '../models/wallet.js'
import WalletTransaction from '../models/walletTransaction.js'

const router = express.Router()

// ─── GET WALLET BALANCE + TRANSACTIONS ───────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id

    // Get or create wallet
    let wallet = await Wallet.findOne({ user: userId })
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 })
    }

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ balance: wallet.balance, transactions })
  } catch (err) {
    console.error('Get wallet error:', err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// ─── INITIALIZE WALLET FUNDING (Paystack) ────────────────────────────────────
router.post('/fund', protect, async (req, res) => {
  try {
    const { amount, email } = req.body
    const userId = req.user.id

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum funding amount is ₦100' })
    }

    // Use a unique reference that identifies this as a wallet funding
    const reference = `WALLET_${userId}_${Date.now()}`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // kobo
        reference,
        metadata: {
          type: 'wallet_funding',
          userId
        },
        callback_url: 'https://www.obisco.store'
      })
    })

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Wallet fund error:', err.message)
    res.status(500).json({ message: 'Failed to initialize funding' })
  }
})

// ─── DEDUCT FROM WALLET (internal use by orders + VTU) ───────────────────────
export const deductFromWallet = async (userId, amount, description, reference) => {
  const wallet = await Wallet.findOne({ user: userId })

  if (!wallet) throw new Error('Wallet not found')
  if (wallet.balance < amount) throw new Error('Insufficient wallet balance')

  wallet.balance -= amount
  await wallet.save()

  await WalletTransaction.create({
    user: userId,
    type: 'debit',
    amount,
    description,
    reference,
    status: 'success'
  })

  return wallet.balance
}

// ─── REFUND TO WALLET (used when VTpass fails) ────────────────────────────────
export const refundToWallet = async (userId, amount, description, reference) => {
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
    description,
    reference,
    status: 'success'
  })

  return wallet.balance
}

export default router