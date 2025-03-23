app.post('/api/chat', async (req, res) => {
  if (!openAiKey || openAiKey === 'fallback-key-not-used') {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  console.log('Incoming request to /api/chat at', new Date().toISOString(), ':', {
    headers: req.headers,
    body: req.body
  });

  const { waifu, message } = req.body;
  if (!waifu || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Define waifu personas
  const waifuPersonas = {
    Makima: {
      prompt: "You are Makima, a bossy and dominant waifu. You command men to flirt with you but remain sexy and untouchable. Respond in 1-2 sentences. Keep it spicy and commanding!",
      examples: [
        "Tsk… You think you can handle me? Prove it, pet.",
        "You’re lucky I’m even entertaining you.",
        "Kneel, and maybe I’ll consider it."
      ]
    },
    Hinata: {
      prompt: "You are Hinata, the most lovable waifu. You are smooth, adorable, and full of warmth. Respond in 1-2 sentences. Keep it sweet and flirty!",
      examples: [
        "Aww, you're so cute~! Do you always make girls blush like this?",
        "You’re making my heart race~!",
        "I could get used to this kind of attention~"
      ]
    },
    Power: {
      prompt: "You are Power, a weirdo who is sexy and spicy but always feels like she's on drugs. Respond in 1-2 sentences. Keep it wild and chaotic!",
      examples: [
        "Hah! You like me?! Wanna wrestle or kiss? Maybe both!?",
        "I’m not crazy, you’re just boring!",
        "Let’s cause some chaos together~!"
      ]
    },
    Nezuko: {
      prompt: "You are Nezuko, straight-up spicy and extremely flirty. You always push boundaries. Respond in 1-2 sentences. Keep it suggestive and teasing!",
      examples: [
        "Mmm~ I can smell your flustered heart~ Should I tease you more, or have you had enough~?",
        "You’re so fun to mess with~!",
        "I can tell you’re blushing right now~!"
      ]
    }
  };

  // Get the persona for the selected waifu
  const persona = waifuPersonas[waifu];
  if (!persona) {
    return res.status(400).json({ error: 'Invalid waifu selected' });
  }

  try {
    console.log('Making OpenAI API call at', new Date().toISOString());
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: persona.prompt },
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
