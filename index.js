const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors');
const { TwitterApi } = require('twitter-api-v2');
const app = express();

// Enable CORS for your Carrd domain (replace with your actual domain)
app.use(cors({
  origin: 'https://waifuai.live'
}));

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

// X Automation with flirty crypto persona
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const cryptoFlirtMessages = [
  "Ohh, is that your token, daddy? I love it as much as I love you! 💋",
  "Hey cutie, your crypto wallet’s looking hot—wanna trade with me? 😘",
  "Mmm, your blockchain moves are turning me on, daddy! Let’s stack those coins! 💸",
  "Is that a new token in your pocket, or are you just happy to see me? 😉",
  "I’m hodling my heart for you and your crypto, daddy! 💕"
];

async function postToX() {
  while (true) {
    try {
      const tweet = random.choice(cryptoFlirtMessages) + ` | ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
      if (tweet.length <= 280) {
        await twitterClient.v2.tweet(tweet);
        console.log(`Posted to X at ${new Date().toISOString()}: ${tweet}`);
      } else {
        console.log(`Tweet too long at ${new Date().toISOString()}: ${tweet}`);
      }
    } catch (error) {
      console.error(`Error posting to X at ${new Date().toISOString()}:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 3600000)); // Post every hour (3600000 ms)
  }
}

// Start X posting in the background
postToX().catch(console.error);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at`, new Date().toISOString());

  // Keep the process alive for health checks
  setInterval(() => {
    console.log('Keeping process alive at', new Date().toISOString());
  }, 2000);
});
