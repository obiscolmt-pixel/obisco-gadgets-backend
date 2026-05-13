import express from 'express';
import axios from 'axios';
import { deductFromWallet, refundToWallet } from './wallet.js';

const router = express.Router();

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

// ─── GET VTPASS WALLET BALANCE ────────────────────────────────────────────────
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

// ─── BUY AIRTIME ──────────────────────────────────────────────────────────────
router.post('/airtime', async (req, res) => {
  try {
    const { network, phone, amount, userId, paymentMethod } = req.body;

    if (!network || !phone || !amount) {
      return res.status(400).json({ error: 'network, phone, and amount are required' });
    }
    if (amount < 50) {
      return res.status(400).json({ error: 'Minimum airtime amount is ₦50' });
    }

    // ── Deduct from wallet first ──
    const reference = `VTU_AIRTIME_${Date.now()}`;
    if (paymentMethod === 'wallet') {
      if (!userId) return res.status(401).json({ error: 'Login required to pay with wallet' });
      try {
        await deductFromWallet(userId, amount, `Airtime — ${network} ₦${amount} to ${phone}`, reference);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const requestId = generateRequestId();
    const payload = {
      request_id: requestId,
      serviceID: network,
      amount,
      phone,
    };

    console.log('Airtime payload:', payload);

    const response = await axios.post(`${baseURL()}/pay`, payload, { headers: postHeaders() });
    const result = response.data;

    console.log('Airtime response:', JSON.stringify(result, null, 2));

    // ── Refund if VTpass failed ──
    if (paymentMethod === 'wallet' && result?.code !== '000') {
      await refundToWallet(userId, amount, `Refund — Airtime failed (${network} ₦${amount})`, `REFUND_${reference}`);
      console.log(`↩️ Wallet refunded ₦${amount} — airtime failed`);
    }

    res.json(result);
  } catch (error) {
    // ── Refund if network/server error ──
    const { userId, amount, network, phone, paymentMethod } = req.body;
    if (paymentMethod === 'wallet' && userId) {
      try {
        await refundToWallet(userId, amount, `Refund — Airtime error (${network} ₦${amount})`, `REFUND_ERR_${Date.now()}`);
        console.log(`↩️ Wallet refunded ₦${amount} — airtime server error`);
      } catch (refundErr) {
        console.error('Refund failed:', refundErr.message);
      }
    }
    console.error('Airtime error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── BUY DATA ─────────────────────────────────────────────────────────────────
router.post('/data', async (req, res) => {
  try {
    const { network, phone, variationCode, amount, userId, paymentMethod } = req.body;

    if (!network || !phone || !variationCode) {
      return res.status(400).json({ error: 'network, phone, and variationCode are required' });
    }

    // ── Deduct from wallet first ──
    const reference = `VTU_DATA_${Date.now()}`;
    if (paymentMethod === 'wallet') {
      if (!userId) return res.status(401).json({ error: 'Login required to pay with wallet' });
      try {
        await deductFromWallet(userId, amount, `Data — ${network} ₦${amount} to ${phone}`, reference);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${baseURL()}/pay`, {
      request_id: requestId,
      serviceID: network,
      billersCode: phone,
      variation_code: variationCode,
      amount,
      phone,
    }, { headers: postHeaders() });

    const result = response.data;
    console.log('Data response:', JSON.stringify(result, null, 2));

    // ── Refund if VTpass failed ──
    if (paymentMethod === 'wallet' && result?.code !== '000') {
      await refundToWallet(userId, amount, `Refund — Data failed (${network} ₦${amount})`, `REFUND_${reference}`);
      console.log(`↩️ Wallet refunded ₦${amount} — data failed`);
    }

    res.json(result);
  } catch (error) {
    const { userId, amount, network, phone, paymentMethod } = req.body;
    if (paymentMethod === 'wallet' && userId) {
      try {
        await refundToWallet(userId, amount, `Refund — Data error (${network} ₦${amount})`, `REFUND_ERR_${Date.now()}`);
        console.log(`↩️ Wallet refunded ₦${amount} — data server error`);
      } catch (refundErr) {
        console.error('Refund failed:', refundErr.message);
      }
    }
    console.error('Data error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── PAY ELECTRICITY ──────────────────────────────────────────────────────────
router.post('/electricity', async (req, res) => {
  try {
    const { disco, meterNumber, meterType, amount, phone, userId, paymentMethod } = req.body;

    if (!disco || !meterNumber || !meterType || !amount || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // ── Deduct from wallet first ──
    const reference = `VTU_ELEC_${Date.now()}`;
    if (paymentMethod === 'wallet') {
      if (!userId) return res.status(401).json({ error: 'Login required to pay with wallet' });
      try {
        await deductFromWallet(userId, amount, `Electricity — ${disco} ₦${amount} (${meterNumber})`, reference);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${baseURL()}/pay`, {
      request_id: requestId,
      serviceID: disco,
      billersCode: meterNumber,
      variation_code: meterType,
      amount,
      phone,
    }, { headers: postHeaders() });

    const result = response.data;
    console.log('Electricity response:', JSON.stringify(result, null, 2));

    // ── Refund if VTpass failed ──
    if (paymentMethod === 'wallet' && result?.code !== '000') {
      await refundToWallet(userId, amount, `Refund — Electricity failed (${disco} ₦${amount})`, `REFUND_${reference}`);
      console.log(`↩️ Wallet refunded ₦${amount} — electricity failed`);
    }

    res.json(result);
  } catch (error) {
    const { userId, amount, disco, paymentMethod } = req.body;
    if (paymentMethod === 'wallet' && userId) {
      try {
        await refundToWallet(userId, amount, `Refund — Electricity error (${disco} ₦${amount})`, `REFUND_ERR_${Date.now()}`);
        console.log(`↩️ Wallet refunded ₦${amount} — electricity server error`);
      } catch (refundErr) {
        console.error('Refund failed:', refundErr.message);
      }
    }
    console.error('Electricity error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ─── PAY CABLE TV ─────────────────────────────────────────────────────────────
router.post('/cable', async (req, res) => {
  try {
    const { provider, smartCardNumber, variationCode, amount, phone, userId, paymentMethod } = req.body;

    if (!provider || !smartCardNumber || !variationCode || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // ── Deduct from wallet first ──
    const reference = `VTU_CABLE_${Date.now()}`;
    if (paymentMethod === 'wallet') {
      if (!userId) return res.status(401).json({ error: 'Login required to pay with wallet' });
      try {
        await deductFromWallet(userId, amount, `Cable TV — ${provider} ₦${amount} (${smartCardNumber})`, reference);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const requestId = generateRequestId();

    const response = await axios.post(`${baseURL()}/pay`, {
      request_id: requestId,
      serviceID: provider,
      billersCode: smartCardNumber,
      variation_code: variationCode,
      amount,
      phone,
    }, { headers: postHeaders() });

    const result = response.data;
    console.log('Cable response:', JSON.stringify(result, null, 2));

    // ── Refund if VTpass failed ──
    if (paymentMethod === 'wallet' && result?.code !== '000') {
      await refundToWallet(userId, amount, `Refund — Cable failed (${provider} ₦${amount})`, `REFUND_${reference}`);
      console.log(`↩️ Wallet refunded ₦${amount} — cable failed`);
    }

    res.json(result);
  } catch (error) {
    const { userId, amount, provider, paymentMethod } = req.body;
    if (paymentMethod === 'wallet' && userId) {
      try {
        await refundToWallet(userId, amount, `Refund — Cable error (${provider} ₦${amount})`, `REFUND_ERR_${Date.now()}`);
        console.log(`↩️ Wallet refunded ₦${amount} — cable server error`);
      } catch (refundErr) {
        console.error('Refund failed:', refundErr.message);
      }
    }
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