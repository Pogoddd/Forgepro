const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// AI endpoint
app.post('/api/ai', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Brak GROQ_API_KEY na serwerze. Dodaj w Railway → Variables.' });
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        temperature: 0.7,
        ...req.body,
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Błąd Groq' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd połączenia: ' + err.message });
  }
});

// Health check - open this URL to verify everything works
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ForgePro',
    ai: GROQ_API_KEY ? 'Groq OK' : 'BRAK KLUCZA',
    time: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('ForgePro na porcie ' + PORT);
  console.log('AI: ' + (GROQ_API_KEY ? 'Groq OK' : 'BRAK GROQ_API_KEY!'));
});
