app.post('/api/chat', async (req, res) => {
  if (!openAiKey || openAiKey === 'fallback-key-not-used') {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

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
        max_tokens: 50 // Limit response length
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
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
