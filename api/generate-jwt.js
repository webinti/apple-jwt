// /api/generate-jwt.js
const jwt = require('jsonwebtoken');

// IMPORTANT: corriger les \n stockés dans Vercel
const PRIVATE_KEY = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const TEAM_ID = process.env.TEAM_ID;     // Apple Team ID
const CLIENT_ID = process.env.CLIENT_ID; // Services ID (ex: com.tonapp.web)
const KEY_ID = process.env.KEY_ID;       // Key ID de la clé .p8

module.exports = async (req, res) => {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!PRIVATE_KEY || !TEAM_ID || !CLIENT_ID || !KEY_ID) {
    return res.status(500).json({
      error: 'server_config',
      message: 'Missing env vars: APPLE_PRIVATE_KEY, TEAM_ID, CLIENT_ID, KEY_ID'
    });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 24 * 180; // 180 jours

    const payload = {
      iss: TEAM_ID,
      iat: now,
      exp,
      aud: 'https://appleid.apple.com',
      sub: CLIENT_ID
    };

    const token = jwt.sign(payload, PRIVATE_KEY, {
      algorithm: 'ES256',
      keyid: KEY_ID
    });

    return res.status(200).json({
      client_secret: token,
      expires_in: exp - now,
      generated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error generating JWT:', e);
    return res.status(500).json({ error: 'jwt_generation_failed', message: e.message });
  }
};
