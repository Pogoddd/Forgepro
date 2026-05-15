const { applyCors, handleOptions, getFirebasePublicConfig } = require('./_lib/shared');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!applyCors(req, res)) {
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }

  const auth = getFirebasePublicConfig();

  res.status(200).json({
    status: 'ok',
    app: 'ForgePro',
    version: 'vercel-migration-1',
    ai: process.env.GROQ_API_KEY ? 'configured' : 'missing_api_key',
    auth: auth.enabled ? 'configured' : 'missing_firebase_config',
    time: new Date().toISOString()
  });
};
