const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Inject Groq key safely into HTML (key stays server-side, injected at runtime)
app.get('/', (req, res) => {
  const fs = require('fs');
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  // Inject the key into the placeholder
  html = html.replace(
    "window._GROQ_KEY = '';",
    `window._GROQ_KEY = '${GROQ_API_KEY || ''}';`
  );
  res.send(html);
});

// Proxy endpoint (backup — also works via direct browser call with injected key)
app.post('/api/ai', async (req, res) => {
  const key = GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'Brak klucza GROQ_API_KEY na serwerze.' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        ...req.body,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd AI: ' + err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'ForgePro',
    ai: GROQ_API_KEY ? 'Groq połączony ✅' : 'Brak klucza ⚠️',
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🔥 ForgePro działa na porcie ${PORT}`);
  console.log(`   AI: ${GROQ_API_KEY ? 'Groq ✅' : '⚠️  Brak GROQ_API_KEY!'}`);
});
