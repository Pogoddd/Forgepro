const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_MESSAGE_COUNT = 24;
const MAX_MESSAGE_LENGTH = 4000;
const FIREBASE_PUBLIC_CONFIG_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function getFirebasePublicConfig() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  };

  const enabled = FIREBASE_PUBLIC_CONFIG_KEYS.every((key) => Boolean(process.env[key]));
  return { enabled, firebase: config };
}

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Origin not allowed by CORS'));
}

function clampNumber(value, min, max, fallback) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const role = typeof message.role === 'string' ? message.role.trim() : '';
  const content = typeof message.content === 'string' ? message.content.trim() : '';
  const allowedRoles = new Set(['system', 'user', 'assistant']);

  if (!allowedRoles.has(role) || !content) {
    return null;
  }

  return {
    role,
    content: content.slice(0, MAX_MESSAGE_LENGTH),
  };
}

function parseChatRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Nieprawidlowe dane zapytania.');
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error('Brak wiadomosci do wyslania.');
  }

  if (body.messages.length > MAX_MESSAGE_COUNT) {
    throw new Error('Za dluga historia rozmowy.');
  }

  const messages = body.messages
    .map(normalizeMessage)
    .filter(Boolean);

  if (messages.length === 0) {
    throw new Error('Brak poprawnych wiadomosci.');
  }

  return {
    model: DEFAULT_MODEL,
    messages,
    max_tokens: Math.round(clampNumber(body.max_tokens, 128, 1024, 700)),
    temperature: clampNumber(body.temperature, 0, 1, 0.7),
  };
}

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({
    app: 'ForgePro',
    auth: getFirebasePublicConfig(),
  });
});

app.post('/api/ai', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: 'Brak GROQ_API_KEY na serwerze. Dodaj klucz w zmiennych srodowiskowych.',
    });
  }

  let payload;

  try {
    payload = parseChatRequest(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Blad Groq API.',
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(502).json({
      error: `Blad polaczenia z AI: ${error.message}`,
    });
  }
});

app.get('/health', (req, res) => {
  const auth = getFirebasePublicConfig();
  res.json({
    status: 'ok',
    app: 'ForgePro',
    version: 'cleanup-1',
    ai: GROQ_API_KEY ? 'configured' : 'missing_api_key',
    auth: auth.enabled ? 'configured' : 'missing_firebase_config',
    time: new Date().toISOString(),
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ForgePro na porcie ${PORT}`);
  console.log(`AI: ${GROQ_API_KEY ? 'Groq OK' : 'BRAK GROQ_API_KEY'}`);
  console.log(`CORS: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'otwarte (brak ALLOWED_ORIGINS)'}`);
});
