const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors');
const { TwitterApi } = require('twitter-api-v2');
const app = express();

app.use(cors());
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

const openAiKey = process.env.OPENAI_API_KEY || 'fallback-key-not-used'; // Fallback to prevent crash
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

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET
});

const cryptoFlirtMessages = [
  "Ohh, is that your token, daddy? I love it as much as I love you! 💋",
  "Hey cutie, your crypto wallet’s looking hot—wanna trade with me? 😘",
  "Mmm, your blockchain moves are turning me on, daddy! Let’s stack those coins! 💸",
  "Is that a new token in your pocket, or are you just happy to see me? 😉",
  "I’m hodling my heart for you and your crypto, daddy! 💕"
];

function getRandomMessage() {
  return cryptoFlirtMessages[Math.floor(Math.random() * cryptoFlirtMessages.length)];
}

async function postToX() {
  try {
    const tweet = `${getRandomMessage()} | ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
    if (tweet.length <= 280) {
      await twitterClient.v2.tweet(tweet);
      console.log(`Posted to X at ${new Date().toISOString()}: ${tweet}`);
    } else {
      console.log(`Tweet too long at ${new Date().toISOString()}: ${tweet}`);
    }
  } catch (error) {
    console.error(`Error posting to X at ${new Date().toISOString()}:`, error);
  }
  setTimeout(postToX, 3600000);
}

if (process.env.TWITTER_APP_KEY && process.env.TWITTER_APP_SECRET && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_SECRET) {
  postToX().catch(console.error);
} else {
  console.error('Twitter API credentials missing, skipping X posting');
}

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
