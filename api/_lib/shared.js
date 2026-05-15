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
  'FIREBASE_APP_ID'
];

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function getFirebasePublicConfig() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };

  const enabled = FIREBASE_PUBLIC_CONFIG_KEYS.every((key) => Boolean(process.env[key]));
  return { enabled, firebase: config };
}

function clampNumber(value, min, max, fallback) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null;

  const role = typeof message.role === 'string' ? message.role.trim() : '';
  const content = typeof message.content === 'string' ? message.content.trim() : '';
  const allowedRoles = new Set(['system', 'user', 'assistant']);

  if (!allowedRoles.has(role) || !content) return null;

  return {
    role,
    content: content.slice(0, MAX_MESSAGE_LENGTH)
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

  const messages = body.messages.map(normalizeMessage).filter(Boolean);
  if (messages.length === 0) {
    throw new Error('Brak poprawnych wiadomosci.');
  }

  return {
    model: DEFAULT_MODEL,
    messages,
    max_tokens: Math.round(clampNumber(body.max_tokens, 128, 1024, 700)),
    temperature: clampNumber(body.temperature, 0, 1, 0.7)
  };
}

function applyCors(req, res) {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  if (!origin) return true;
  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return true;
  }

  return false;
}

function handleOptions(req, res) {
  if (req.method !== 'OPTIONS') return false;
  const ok = applyCors(req, res);
  res.status(ok ? 204 : 403).end();
  return true;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function fetchGroq(payload) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error('Brak GROQ_API_KEY na serwerze. Dodaj klucz w zmiennych srodowiskowych.');
    error.status = 500;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error?.message || 'Blad Groq API.');
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Blad polaczenia z AI: Request timeout');
      timeoutError.status = 504;
      throw timeoutError;
    }
    if (!error.status) {
      const upstreamError = new Error(`Blad polaczenia z AI: ${error.message}`);
      upstreamError.status = 502;
      throw upstreamError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  getFirebasePublicConfig,
  parseChatRequest,
  applyCors,
  handleOptions,
  readJsonBody,
  fetchGroq
};
