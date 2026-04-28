import express from 'express';
import axios from 'axios';

const router = express.Router();

// VTpass credentials from environment variables
const VTPASS_BASE_URL = process.env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api';
const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;
const VTPASS_EMAIL = process.env.VTPASS_EMAIL;
const VTPASS_PASSWORD = process.env.VTPASS_PASSWORD;

// Generate Basic Auth token
const getBasicAuth = () => {
  const credentials = Buffer.from(`${VTPASS_EMAIL}:${VTPASS_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
};

// Generate unique request ID
const generateRequestId = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${Date.now()}`;
};

// ─── GET WALLET BALANCE ───────────────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  try {
    const response = await axios.get(`${VTPASS_BASE_URL}/balance`, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Authorization': getBasicAuth(),
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET SERVICE VARIATIONS (Data plans, Cable bouquets, etc.) ───────────────
router.get('/variations/:serviceID', async (req, res) => {
  try {
    const { serviceID } = req.params;
    const response = await axios.get(`${VTPASS_BASE_URL}/service-variations?serviceID=${serviceID}`, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Authorization': getBasicAuth(),
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── VERIFY METER / SMART CARD NUMBER ────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { billersCode, serviceID, type } = req.body;
    const response = await axios.post(`${VTPASS_BASE_URL}/merchant-verify`, {
      billersCode,
      serviceID,
      type
    }, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── BUY AIRTIME ─────────────────────────────────────────────────────────────
router.post('/airtime', async (req, res) => {
  try {
    const { network, phone, amount } = req.body;

    // Validate
    if (!network || !phone || !amount) {
      return res.status(400).json({ error: 'network, phone, and amount are required' });
    }
    if (amount < 50) {
      return res.status(400).json({ error: 'Minimum airtime amount is ₦50' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${VTPASS_BASE_URL}/pay`, {
      request_id: requestId,
      serviceID: network, // mtn, airtel, glo, etisalat
      amount: amount,
      phone: phone,
    }, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Secret-Key': VTPASS_SECRET_KEY,
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── BUY DATA ─────────────────────────────────────────────────────────────────
router.post('/data', async (req, res) => {
  try {
    const { network, phone, variationCode, amount } = req.body;

    // network data serviceIDs: mtn-data, airtel-data, glo-data, etisalat-data
    if (!network || !phone || !variationCode) {
      return res.status(400).json({ error: 'network, phone, and variationCode are required' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${VTPASS_BASE_URL}/pay`, {
      request_id: requestId,
      serviceID: network, // e.g. mtn-data
      billersCode: phone,
      variation_code: variationCode,
      amount: amount,
      phone: phone,
    }, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Secret-Key': VTPASS_SECRET_KEY,
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PAY ELECTRICITY BILL ─────────────────────────────────────────────────────
router.post('/electricity', async (req, res) => {
  try {
    const { disco, meterNumber, meterType, amount, phone } = req.body;

    // disco serviceIDs: ikeja-electric, eko-electric, kano-electric, phed, etc.
    if (!disco || !meterNumber || !meterType || !amount || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${VTPASS_BASE_URL}/pay`, {
      request_id: requestId,
      serviceID: disco,
      billersCode: meterNumber,
      variation_code: meterType, // prepaid or postpaid
      amount: amount,
      phone: phone,
    }, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Secret-Key': VTPASS_SECRET_KEY,
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PAY CABLE TV ─────────────────────────────────────────────────────────────
router.post('/cable', async (req, res) => {
  try {
    const { provider, smartCardNumber, variationCode, amount, phone } = req.body;

    // provider serviceIDs: dstv, gotv, startimes
    if (!provider || !smartCardNumber || !variationCode || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${VTPASS_BASE_URL}/pay`, {
      request_id: requestId,
      serviceID: provider,
      billersCode: smartCardNumber,
      variation_code: variationCode,
      amount: amount,
      phone: phone,
    }, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Secret-Key': VTPASS_SECRET_KEY,
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── QUERY TRANSACTION STATUS ─────────────────────────────────────────────────
router.post('/requery', async (req, res) => {
  try {
    const { requestId } = req.body;
    const response = await axios.post(`${VTPASS_BASE_URL}/requery`, {
      request_id: requestId
    }, {
      headers: {
        'Public-Key': VTPASS_PUBLIC_KEY,
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;