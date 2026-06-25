import Anthropic from '@anthropic-ai/sdk';
import Conversation from '../models/Conversation.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Send a reply back to the customer via WhatsApp API
export const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    );
    const data = await response.json();
    console.log('Message sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
};

// Show typing indicator to customer
export const showTypingIndicator = async (to, messageId) => {
  try {
    // Mark message as read
    await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      }
    );

    // Show typing indicator
    await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'typing_indicator',
          typing_indicator: {
            type: 'text'
          }
        })
      }
    );

    console.log('Typing indicator sent to', to);
  } catch (error) {
    console.error('Typing indicator error:', error);
  }
};

// Trigger a Termii voice call to escalate to you
export const triggerEscalationCall = async () => {
  try {
    const response = await fetch('https://v3.api.termii.com/api/sms/otp/send/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        phone_number: process.env.OWNER_PHONE,
        pin_attempts: 1,
        pin_time_to_live: 5,
        pin_length: 4,
      })
    });
    const data = await response.json();
    console.log('Escalation call triggered:', data);
    return data;
  } catch (error) {
    console.error('Error triggering escalation call:', error);
  }
};

// Main AI engine — reads message, decides, replies or escalates
export const processWhatsAppMessage = async (from, messageText, messageId) => {
  try {
    // Get or create conversation history for this customer
    let conversation = await Conversation.findOne({ phoneNumber: from });
    if (!conversation) {
      conversation = new Conversation({ phoneNumber: from, messages: [] });
    }

    // Add customer message to history
    conversation.messages.push({ role: 'user', content: messageText });
    conversation.lastMessageAt = new Date();

    // Keep only last 10 messages to avoid token overflow
    if (conversation.messages.length > 10) {
      conversation.messages = conversation.messages.slice(-10);
    }

    // Show typing indicator immediately
    if (messageId) await showTypingIndicator(from, messageId);

    // ── Keyword-based escalation check (runs before AI) ──
    const escalationKeywords = [
      'i want to buy', 'i want to order', 'i want to make payment',
      'i want to pay', 'place an order', 'make a payment',
      'speak to patrick', 'speak to human', 'talk to human',
      'talk to someone', 'speak to someone', 'human agent',
      'i want to purchase', 'how do i pay', 'i am ready to order',
      'i want to place', 'take my order', 'ready to buy',
      'want to purchase', 'want to buy'
    ];
    const lowerMessage = messageText.toLowerCase();
    const isKeywordEscalation = escalationKeywords.some(kw => lowerMessage.includes(kw));

    if (isKeywordEscalation) {
      conversation.isEscalated = true;
      conversation.escalatedAt = new Date();
      conversation.status = 'escalated';
      await conversation.save();

      await sendWhatsAppMessage(
        from,
        'Thank you for reaching out to Obisco Store! A member of our team will get back to you shortly to assist you. 🙏'
      );

      await triggerEscalationCall();
      console.log(`Keyword escalation triggered for ${from}`);
      return;
    }

    // Build message history for Claude
    const messageHistory = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Ask Claude to decide and reply
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `You are a helpful customer service assistant for Obisco Store, a Nigerian e-commerce and VTU platform owned by Patrick Ariogba.

Obisco Store sells: gadgets, electronics, phones, and accessories. It also offers VTU services: airtime top-up, data bundles, electricity bills, and cable TV subscriptions (DSTV, GOtv, Startimes).

Payment is via Paystack (cards, bank transfer) or wallet balance.
Delivery is available to any state in Nigeria.
Website: obisco.store

YOUR RULES:
- Answer ALL questions yourself — greetings, product questions, delivery, VTU, pricing
- Be friendly, professional and concise
- Write in plain conversational English
- Keep replies under 3 sentences
- Do not make up prices — say "please contact us on WhatsApp for current pricing"
- If asked about order status, direct to obisco.store
- NEVER use the word ESCALATE in your reply under any circumstances
- If you cannot help, say "Please contact us directly on WhatsApp for further assistance"`,
      messages: messageHistory
    });

    const aiReply = response.content[0].text.trim();


    // Save and send normal reply
    conversation.messages.push({ role: 'assistant', content: aiReply });
    conversation.status = 'active';
    await conversation.save();

    await sendWhatsAppMessage(from, aiReply);
    console.log(`AI replied to ${from}: ${aiReply}`);

  } catch (error) {
    console.error('AI engine error:', error);
    await sendWhatsAppMessage(
      from,
      'Sorry, we are experiencing a technical issue. Please try again in a moment. 🙏'
    );
  }
};