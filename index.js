const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Rate limiting to prevent bot attacks
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per IP
});
app.use(limiter);

// API key for frontend auth
const validApiKey = 'waifutothemoon0777'; // Your custom random key

// OpenAI API key from environment variable
const openAiKey = process.env.OPENAI_API_KEY;
if (!openAiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  process.exit(1);
}

// Route for waifu chat
app.post('/api/chat', async (req, res) => {
  // Check API key
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${validApiKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { waifu, message, prompt } = req.body;
  if (!waifu || !message || !prompt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // Use 'gpt-4' if you have access
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        }
      }
    );

    const waifuResponse = response.data.choices[0].message.content;
    res.json({ response: waifuResponse });
} catch (error) {
  console.error('OpenAI API Error:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    stack: error.stack
  });
  res.status(500).json({ error: 'Something went wrong' });
}
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
