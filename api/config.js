const { applyCors, handleOptions, getFirebasePublicConfig } = require('./_lib/shared');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!applyCors(req, res)) {
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }

  res.status(200).json({
    app: 'ForgePro',
    auth: getFirebasePublicConfig()
  });
};
