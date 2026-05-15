const {
  applyCors,
  handleOptions,
  parseChatRequest,
  readJsonBody,
  fetchGroq
} = require('./_lib/shared');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!applyCors(req, res)) {
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload;
  try {
    const body = await readJsonBody(req);
    payload = parseChatRequest(body);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Nieprawidlowe dane zapytania.' });
  }

  try {
    const data = await fetchGroq(payload);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'Blad AI.'
    });
  }
};
