import express from 'express'

const router = express.Router()

const COOKIE_EXPIRY_DAYS = 30

const cookieOptions = {
  httpOnly: false,  // false so frontend can read it
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  path: '/',
}

// ─── GET /api/cookies/consent ─────────────────────────────────────────────────
// Check if user has given cookie consent
router.get('/consent', (req, res) => {
  const consent = req.cookies?.obisco_cookies_accepted
  if (consent) {
    res.json({
      hasConsent: true,
      value: consent,
      message: 'Cookie consent found'
    })
  } else {
    res.json({
      hasConsent: false,
      value: null,
      message: 'No cookie consent found'
    })
  }
})

// ─── POST /api/cookies/accept ─────────────────────────────────────────────────
// User accepts cookies
router.post('/accept', (req, res) => {
  res.cookie('obisco_cookies_accepted', 'true', cookieOptions)
  res.json({
    success: true,
    message: `Cookie consent accepted for ${COOKIE_EXPIRY_DAYS} days`,
    expiresIn: `${COOKIE_EXPIRY_DAYS} days`
  })
})

// ─── POST /api/cookies/decline ────────────────────────────────────────────────
// User declines cookies
router.post('/decline', (req, res) => {
  res.cookie('obisco_cookies_accepted', 'false', cookieOptions)
  res.json({
    success: true,
    message: `Cookie consent declined for ${COOKIE_EXPIRY_DAYS} days`,
    expiresIn: `${COOKIE_EXPIRY_DAYS} days`
  })
})

// ─── DELETE /api/cookies/clear ────────────────────────────────────────────────
// Clear cookie consent (for testing)
router.delete('/clear', (req, res) => {
  res.cookie('obisco_cookies_accepted', '', {
    httpOnly: false,
    maxAge: 0,
    path: '/',
  })
  res.json({
    success: true,
    message: 'Cookie consent cleared'
  })
})

export default router