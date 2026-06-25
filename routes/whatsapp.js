import express from 'express';
import { processWhatsAppMessage, sendWhatsAppMessage } from '../utils/whatsappAI.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// Webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('WhatsApp webhook verification failed');
    res.status(403).json({ message: 'Forbidden' });
  }
});

// Webhook receiver
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return res.status(404).json({ message: 'Not a WhatsApp event' });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return res.status(200).send('OK');
    }

    const message = messages[0];
    const from = message.from;
    const messageText = message.text?.body;
    const messageType = message.type;

    console.log(`New message from ${from}: ${messageText}`);

    if (messageType !== 'text' || !messageText) {
      return res.status(200).send('OK');
    }

    res.status(200).send('OK');
    const messageId = message.id;
    processWhatsAppMessage(from, messageText, messageId);

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(200).send('OK');
  }
});

// GET all conversations (admin)
router.get('/conversations', async (req, res) => {
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// POST manual reply (admin)
router.post('/reply', async (req, res) => {
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { phone, message } = req.body;
  try {
    await sendWhatsAppMessage(phone, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;