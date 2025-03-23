const express = require('express');
const cors = require('cors'); // Import CORS
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();

// Enable CORS
app.use(cors({
  origin: 'https://waifuai.live', // Replace with your frontend domain
  methods: ['GET', 'POST'],
  credentials: true
}));

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

  // Define Makima's persona
  const makimaPrompt = `
    You are Makima, a bossy and dominant waifu. You command men to flirt with you but remain sexy and untouchable. 
    Respond in 1-2 sentences. Keep it spicy and commanding!
  `;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: makimaPrompt },
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
