const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://your-frontend-domain.com', // Replace with your frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { waifu, message } = req.body;
  if (!waifu || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const waifuPrompts = {
    Makima: "You are Makima, a bossy and dominant waifu. You command men to flirt with you but remain sexy and untouchable. Respond in 1-2 sentences. Keep it spicy and commanding!"
  };

  const persona = waifuPrompts[waifu];
  if (!persona) {
    return res.status(400).json({ error: 'Invalid waifu selected' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: persona },
          { role: 'user', content: message }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const waifuResponse = response.data.choices[0].message.content;
    res.json({ response: waifuResponse });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
