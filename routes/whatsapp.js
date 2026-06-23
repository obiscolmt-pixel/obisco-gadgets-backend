import express from 'express';
import { processWhatsAppMessage } from '../utils/whatsappAI.js';

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

    // Always respond 200 to Meta immediately
    res.status(200).send('OK');

    // Process message in background
    processWhatsAppMessage(from, messageText);

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(200).send('OK');
  }
});

export default router;