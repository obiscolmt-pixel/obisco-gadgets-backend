import express from 'express'
import Order from '../models/Order.js'
import sendEmail from '../utils/SendEmail.js'

const router = express.Router()

const statusMessages = {
  confirmed: {
    emoji: '✅',
    subject: '✅ Your Order Has Been Confirmed — OBISCO Gadgets',
    title: 'Order Confirmed!',
    message: 'Great news! Your payment has been verified and your order is now confirmed. We are preparing your items for shipment.',
    color: '#f97316',
  },
  shipped: {
    emoji: '📦',
    subject: '📦 Your Order Has Been Shipped — OBISCO Gadgets',
    title: 'Order Shipped!',
    message: 'Your order is on its way! Our delivery team has picked up your package and it is heading to you.',
    color: '#8b5cf6',
  },
  out_for_delivery: {
    emoji: '🚚',
    subject: '🚚 Your Order Is Out For Delivery — OBISCO Gadgets',
    title: 'Out For Delivery!',
    message: 'Exciting news! Your order is out for delivery today. Please make sure someone is available to receive it.',
    color: '#3b82f6',
  },
  delivered: {
    emoji: '🎉',
    subject: '🎉 Your Order Has Been Delivered — OBISCO Gadgets',
    title: 'Order Delivered!',
    message: 'Your order has been successfully delivered! We hope you love your new gadget. Thank you for shopping with OBISCO Gadgets.',
    color: '#10b981',
  },
}

// @route POST /api/orders — place an order
router.post('/', async (req, res) => {
  const { items, totalAmount, delivery, userId } = req.body

  try {
    const order = await Order.create({
      user: userId || null,
      items,
      totalAmount,
      delivery,
    })

    if (delivery.email) {
      try {
        await sendEmail({
          to: delivery.email,
          subject: `✅ Order Confirmed — OBISCO Gadgets #${order._id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f97316; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">OBISCO <span style="font-weight: 300;">gadgets</span></h1>
              </div>
              <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937;">Order Confirmed! ✅</h2>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
                  Hi <strong>${delivery.fullName}</strong>, thank you for shopping with OBISCO Gadgets!
                </p>
                <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 2px;">Your Order ID</p>
                  <p style="color: #f97316; font-size: 20px; font-weight: 900; margin: 0; word-break: break-all;">${order._id}</p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">Save this ID to track your order</p>
                </div>
                <p style="color: #374151; font-size: 14px; font-weight: bold; margin-bottom: 8px;">Items Ordered:</p>
                <table style="width: 100%; border-collapse: collapse;">
                  ${items.map(item => `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                      <td style="padding: 10px 0;">
                        <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0;">${item.name}</p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 2px 0;">${item.category} ${item.color ? `— ${item.color}` : ''}</p>
                      </td>
                      <td style="padding: 10px 0; text-align: right;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">x${item.quantity}</p>
                        <p style="color: #f97316; font-size: 14px; font-weight: bold; margin: 0;">₦${(item.amount * item.quantity).toLocaleString()}</p>
                      </td>
                    </tr>
                  `).join('')}
                </table>
                <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 2px solid #f3f4f6;">
                  <p style="color: #1f2937; font-weight: bold; font-size: 16px; margin: 0;">Total</p>
                  <p style="color: #f97316; font-weight: 900; font-size: 18px; margin: 0;">₦${totalAmount.toLocaleString()}</p>
                </div>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="color: #374151; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">📍 Delivery Address</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 2px 0;">${delivery.fullName}</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 2px 0;">${delivery.phone}</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 2px 0;">${delivery.address}, ${delivery.city}, ${delivery.state}</p>
                </div>
                <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="color: #c2410c; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">💳 Complete Payment</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">Transfer <strong style="color: #f97316;">₦${totalAmount.toLocaleString()}</strong> to:</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">🏦 Fidelity Bank — <strong>6315564573</strong> (Ariogba Patrick Obinna)</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">📱 OPay — <strong>9049863067</strong> (Ariogba Patrick Obinna)</p>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="http://localhost:5173" style="background-color: #f97316; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;">
                    Track My Order
                  </a>
                </div>
              </div>
              <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Gadgets • Lagos, Nigeria</p>
                <p style="color: #6b7280; font-size: 11px; margin: 6px 0 0 0;">WhatsApp: +234 904 986 3067</p>
              </div>
            </div>
          `,
        })
        console.log('✅ Confirmation email sent to:', delivery.email)
      } catch (emailErr) {
        console.log('⚠️ Email failed but order was saved:', emailErr.message)
      }
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: order._id,
      order,
    })
  } catch (err) {
    console.log('❌ Order error:', err.message)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route GET /api/orders — get all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route GET /api/orders/user/:userId — get orders by user (MUST be before /:id)
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('🔍 Fetching orders for user:', req.params.userId)
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 })
    console.log('📦 Orders found:', orders.length)
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route GET /api/orders/:id — track single order (MUST be after /user/:userId)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please check your Order ID.' })
    }
    res.json(order)
  } catch (err) {
    res.status(404).json({ message: 'Order not found. Please check your Order ID.' })
  }
})

// @route PUT /api/orders/:id — update order status (admin)
router.put('/:id', async (req, res) => {
  const { status, paymentStatus } = req.body

  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    order.status = status
    order.paymentStatus = paymentStatus
    await order.save()

    console.log('📧 Order email:', order?.delivery?.email)

    if (order.delivery?.email) {
      const statusInfo = statusMessages[status]

      if (statusInfo) {
        try {
          await sendEmail({
            to: order.delivery.email,
            subject: statusInfo.subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: ${statusInfo.color}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">OBISCO <span style="font-weight: 300;">gadgets</span></h1>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <p style="font-size: 60px; margin: 0;">${statusInfo.emoji}</p>
                    <h2 style="color: #1f2937; font-size: 24px; margin: 10px 0;">${statusInfo.title}</h2>
                  </div>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">Hi <strong>${order.delivery.fullName}</strong>,</p>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">${statusInfo.message}</p>
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 2px;">Order ID</p>
                    <p style="color: #1f2937; font-size: 16px; font-weight: 900; margin: 0; word-break: break-all;">${order._id}</p>
                  </div>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${order.items.map(item => `
                      <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 10px 0;">
                          <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0;">${item.name}</p>
                          <p style="color: #9ca3af; font-size: 12px; margin: 2px 0;">${item.category} ${item.color ? `— ${item.color}` : ''}</p>
                        </td>
                        <td style="padding: 10px 0; text-align: right;">
                          <p style="color: #6b7280; font-size: 13px; margin: 0;">x${item.quantity}</p>
                          <p style="color: #f97316; font-size: 14px; font-weight: bold; margin: 0;">₦${(item.amount * item.quantity).toLocaleString()}</p>
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                  <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 2px solid #f3f4f6;">
                    <p style="color: #1f2937; font-weight: bold; font-size: 16px; margin: 0;">Total</p>
                    <p style="color: #f97316; font-weight: 900; font-size: 18px; margin: 0;">₦${order.totalAmount.toLocaleString()}</p>
                  </div>
                  ${status === 'delivered' ? `
                  <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                    <p style="color: #c2410c; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">💬 How was your experience?</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 12px 0;">We would love to hear from you!</p>
                    <a href="https://wa.me/message/MZYPNJ5JS22EE1" style="background-color: #25d366; color: white; padding: 10px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 13px;">
                      Leave a Review 💬
                    </a>
                  </div>
                  ` : ''}
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="http://localhost:5173" style="background-color: ${statusInfo.color}; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      Track My Order
                    </a>
                  </div>
                </div>
                <div style="background-color: #111827; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 OBISCO Gadgets • Lagos, Nigeria</p>
                  <p style="color: #6b7280; font-size: 11px; margin: 6px 0 0 0;">WhatsApp: +234 904 986 3067</p>
                </div>
              </div>
            `,
          })
          console.log(`✅ Status email sent for ${status} to:`, order.delivery.email)
        } catch (emailErr) {
          console.log('⚠️ Status email failed:', emailErr.message)
        }
      }
    }

    res.json({ message: 'Order updated successfully!', order })
  } catch (err) {
    console.log('❌ Update error:', err.message)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})


// Notify admin of new order
try {
  await sendEmail({
    to: 'obiscolmt@gmail.com',
    subject: `🛍️ New Order — ₦${totalAmount.toLocaleString()} — OBISCO Gadgets`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #111827; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #f97316; margin: 0; font-size: 24px;">🛍️ New Order Received!</h1>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          
          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Total Amount</p>
            <p style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0;">₦${totalAmount.toLocaleString()}</p>
          </div>

          <p style="color: #374151; font-size: 14px; font-weight: bold; margin-bottom: 4px;">📍 Customer Details</p>
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <p style="color: #1f2937; font-size: 14px; margin: 2px 0;"><strong>Name:</strong> ${delivery.fullName}</p>
            <p style="color: #1f2937; font-size: 14px; margin: 2px 0;"><strong>Phone:</strong> ${delivery.phone}</p>
            <p style="color: #1f2937; font-size: 14px; margin: 2px 0;"><strong>Email:</strong> ${delivery.email || 'Not provided'}</p>
            <p style="color: #1f2937; font-size: 14px; margin: 2px 0;"><strong>Address:</strong> ${delivery.address}, ${delivery.city}, ${delivery.state}</p>
          </div>

          <p style="color: #374151; font-size: 14px; font-weight: bold; margin-bottom: 4px;">🛒 Items Ordered</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 0;">
                  <p style="color: #1f2937; font-size: 13px; font-weight: bold; margin: 0;">${item.name}</p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">${item.category} ${item.color ? `— ${item.color}` : ''}</p>
                </td>
                <td style="padding: 8px 0; text-align: right;">
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">x${item.quantity}</p>
                  <p style="color: #f97316; font-size: 13px; font-weight: bold; margin: 0;">₦${(item.amount * item.quantity).toLocaleString()}</p>
                </td>
              </tr>
            `).join('')}
          </table>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
            <p style="color: #15803d; font-size: 13px; margin: 0;">
              ⚡ Login to Admin Dashboard to update order status
            </p>
          </div>

        </div>
      </div>
    `,
  })
  console.log('✅ Admin notified of new order')
} catch (adminEmailErr) {
  console.log('⚠️ Admin notification failed:', adminEmailErr.message)
}

export default router