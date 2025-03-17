const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const app = express();

// Manually set CORS headers
app.use((req, res, next) => {
  console.log(`Setting CORS headers for ${req.method} ${req.url} from ${req.headers.origin}`);
  res.header('Access-Control-Allow-Origin', 'https://waifuai.live');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  console.log('Handling OPTIONS preflight request');
  res.header('Access-Control-Allow-Origin', 'https://waifuai.live');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url} from ${req.headers.origin}`);
  res.on('finish', () => {
    console.log(`Response sent: ${res.statusCode} to ${req.headers.origin}`);
  });
  next();
});

app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});
app.use(limiter);

app.get('/health', (req, res) => {
  console.log('Health check requested at', new Date().toISOString());
  res.status(200).json({ status: 'OK' });
});

app.get('/', (req, res) => {
  console.log('Root route requested at', new Date().toISOString());
  res.send('Waifu Backend is running!');
});

const openAiKey = process.env.OPENAI_API_KEY || 'fallback-key-not-used';
if (!openAiKey || openAiKey === 'fallback-key-not-used') {
  console.warn('Warning: OPENAI_API_KEY not set, /api/chat will fail');
}

app.post('/api/chat', async (req, res) => {
  if (!openAiKey || openAiKey === 'fallback-key-not-used') {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  console.log('Incoming request to /api/chat at', new Date().toISOString(), ':', {
    headers: req.headers,
    body: req.body
  });

  const { waifu, message, prompt } = req.body;
  if (!waifu || !message || !prompt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('Making OpenAI API call at', new Date().toISOString());
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
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

    console.log('OpenAI API call successful at', new Date().toISOString());
    const waifuResponse = response.data.choices[0].message.content;
    res.json({ response: waifuResponse });
  } catch (error) {
    console.error('OpenAI API Error at', new Date().toISOString(), ':', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({ error: 'Something went wrong' });
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception at', new Date().toISOString(), ':', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at', new Date().toISOString(), ':', promise, 'reason:', reason);
  process.exit(1);
});

console.log('Starting the Waifu Backend at', new Date().toISOString());

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} at`, new Date().toISOString());
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM at', new Date().toISOString(), ', shutting down gracefully...');
  process.exit(0);
});
