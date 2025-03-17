const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors'); // Add CORS package
const app = express();

// Enable CORS for all origins (or specify your Carrd domain)
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Rate limiting to prevent bot attacks
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per IP
});
app.use(limiter);

// Middleware to simulate readiness
app.use((req, res, next) => {
  console.log('Middleware running at', new Date().toISOString());
  setTimeout(next, 5000); // Delay 5 seconds
});

// Health check route for Railway
app.get('/health', (req, res) => {
  console.log('Health check requested at', new Date().toISOString());
  res.status(200).json({ status: 'OK' });
});

// Root route to test basic connectivity
app.get('/', (req, res) => {
  console.log('Root route requested at', new Date().toISOString());
  res.send('Waifu Backend is running!');
});

// API key for frontend auth
const validApiKey = 'waifutothemoon0777';

// OpenAI API key from environment variable
const openAiKey = process.env.OPENAI_API_KEY;
if (!openAiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set at', new Date().toISOString());
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception at', new Date().toISOString(), ':', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at', new Date().toISOString(), ':', promise, 'reason:', reason);
  process.exit(1);
});

// Log when the app starts
console.log('Starting the Waifu Backend at', new Date().toISOString());

// Route for waifu chat
app.post('/api/chat', async (req, res) => {
  console.log('Incoming request to /api/chat at', new Date().toISOString(), ':', {
    headers: req.headers,
    body: req.body
  });

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

// Log when the server is about to shut down
process.on('SIGTERM', () => {
  console.log('Received SIGTERM at', new Date().toISOString(), ', shutting down gracefully...');
  process.exit(0);
});

// Log memory usage to debug resource issues
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage at', new Date().toISOString(), ':', {
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(used.external / 1024 / 1024) + ' MB'
  });
}, 5000);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at`, new Date().toISOString());

  // Keep the process alive for health checks
  setInterval(() => {
    console.log('Keeping process alive at', new Date().toISOString());
  }, 2000);
});
