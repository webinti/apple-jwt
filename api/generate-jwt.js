const jwt = require('jsonwebtoken');

// Récupération depuis les variables d'environnement Vercel
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
const TEAM_ID = process.env.TEAM_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const KEY_ID = process.env.KEY_ID;

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier que les variables d'environnement sont présentes
  if (!APPLE_PRIVATE_KEY || !TEAM_ID || !CLIENT_ID || !KEY_ID) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Missing environment variables. Please configure: APPLE_PRIVATE_KEY, TEAM_ID, CLIENT_ID, KEY_ID'
    });
  }

  try {
    // Génération du JWT
    const token = jwt.sign(
      {},
      APPLE_PRIVATE_KEY,
      {
        algorithm: 'ES256',
        expiresIn: '180d',
        audience: 'https://appleid.apple.com',
        issuer: TEAM_ID,
        subject: CLIENT_ID,
        header: {
          alg: 'ES256',
          kid: KEY_ID
        }
      }
    );

    return res.status(200).json({
      client_secret: token,
      expires_in: 15552000,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating JWT:', error);
    return res.status(500).json({ 
      error: 'Failed to generate token',
      message: error.message 
    });
  }
};
