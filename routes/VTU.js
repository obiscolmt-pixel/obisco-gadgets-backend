import express from 'express';
import axios from 'axios';

const router = express.Router();

// Read env vars at request time (not module load time)
// This fixes the ES Module dotenv timing issue
const getHeaders = () => ({
  'api-key': process.env.VTPASS_API_KEY,
  'public-key': process.env.VTPASS_PUBLIC_KEY,
});

const postHeaders = () => ({
  'api-key': process.env.VTPASS_API_KEY,
  'secret-key': process.env.VTPASS_SECRET_KEY,
  'Content-Type': 'application/json',
});

const baseURL = () => process.env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api';

const generateRequestId = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${Date.now()}`;
};

// ─── GET WALLET BALANCE ───────────────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  try {
    const response = await axios.get(`${baseURL()}/balance`, {
      headers: getHeaders()
    });
    res.json(response.data);
  } catch (error) {
    console.error('Balance error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── GET SERVICE VARIATIONS ───────────────────────────────────────────────────
router.get('/variations/:serviceID', async (req, res) => {
  try {
    const { serviceID } = req.params;
    const response = await axios.get(`${baseURL()}/service-variations?serviceID=${serviceID}`, {
      headers: getHeaders()
    });
    res.json(response.data);
  } catch (error) {
    console.error('Variations error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── VERIFY METER / SMART CARD ────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { billersCode, serviceID, type } = req.body;
    const response = await axios.post(`${baseURL()}/merchant-verify`, {
      billersCode,
      serviceID,
      type
    }, { headers: postHeaders() });
    res.json(response.data);
  } catch (error) {
    console.error('Verify error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── BUY AIRTIME ─────────────────────────────────────────────────────────────
router.post('/airtime', async (req, res) => {
  try {
    const { network, phone, amount } = req.body;

    if (!network || !phone || !amount) {
      return res.status(400).json({ error: 'network, phone, and amount are required' });
    }
    if (amount < 50) {
      return res.status(400).json({ error: 'Minimum airtime amount is ₦50' });
    }

    const requestId = generateRequestId();
    const payload = {
      request_id: requestId,
      serviceID: network,
      amount: amount,
      phone: phone,
    };

    console.log('Airtime payload:', payload);
    console.log('API KEY at runtime:', process.env.VTPASS_API_KEY?.slice(0, 8));

    const response = await axios.post(`${baseURL()}/pay`, payload, {
      headers: postHeaders()
    });

    console.log('Airtime response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);

  } catch (error) {
    console.error('Airtime error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── BUY DATA ─────────────────────────────────────────────────────────────────
router.post('/data', async (req, res) => {
  try {
    const { network, phone, variationCode, amount } = req.body;

    if (!network || !phone || !variationCode) {
      return res.status(400).json({ error: 'network, phone, and variationCode are required' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${baseURL()}/pay`, {
      request_id: requestId,
      serviceID: network,
      billersCode: phone,
      variation_code: variationCode,
      amount: amount,
      phone: phone,
    }, { headers: postHeaders() });

    console.log('Data response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);

  } catch (error) {
    console.error('Data error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── PAY ELECTRICITY ──────────────────────────────────────────────────────────
router.post('/electricity', async (req, res) => {
  try {
    const { disco, meterNumber, meterType, amount, phone } = req.body;

    if (!disco || !meterNumber || !meterType || !amount || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${baseURL()}/pay`, {
      request_id: requestId,
      serviceID: disco,
      billersCode: meterNumber,
      variation_code: meterType,
      amount: amount,
      phone: phone,
    }, { headers: postHeaders() });

    console.log('Electricity response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);

  } catch (error) {
    console.error('Electricity error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── PAY CABLE TV ─────────────────────────────────────────────────────────────
router.post('/cable', async (req, res) => {
  try {
    const { provider, smartCardNumber, variationCode, amount, phone } = req.body;

    if (!provider || !smartCardNumber || !variationCode || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${baseURL()}/pay`, {
      request_id: requestId,
      serviceID: provider,
      billersCode: smartCardNumber,
      variation_code: variationCode,
      amount: amount,
      phone: phone,
    }, { headers: postHeaders() });

    console.log('Cable response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);

  } catch (error) {
    console.error('Cable error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── QUERY TRANSACTION ────────────────────────────────────────────────────────
router.post('/requery', async (req, res) => {
  try {
    const { requestId } = req.body;
    const response = await axios.post(`${baseURL()}/requery`, {
      request_id: requestId
    }, { headers: postHeaders() });
    res.json(response.data);
  } catch (error) {
    console.error('Requery error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

export default router;