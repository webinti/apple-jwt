const jwt = require('jsonwebtoken');

// Votre clé privée Apple (contenu du fichier .p8)
const APPLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgLHMjsv0wA1Ro1O+0
bbrW49V7p/KZ0/vS9jBCDb+ebTugCgYIKoZIzj0DAQehRANCAAR8N0+bqppONFFZ
W2Irg9NFuJmbgDoDpY8c+lPDhZCJNUnKml42KSOfw9SHDJd5BsLL15RNKjjJzZAe
w+rWow7Q
-----END PRIVATE KEY-----`;

const TEAM_ID = '379BFP3Y99'; // Votre Team ID
const CLIENT_ID = 'com.webinti.sign'; // Votre Service ID
const KEY_ID = 'NSCPFZ994X'; // Votre Key ID

module.exports = async (req, res) => {
  // Configuration CORS pour autoriser Bubble
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }


  try {
    // Génération du JWT
    const token = jwt.sign(
      {}, // Payload vide
      APPLE_PRIVATE_KEY,
      {
        algorithm: 'ES256',
        expiresIn: '180d', // 6 mois (maximum autorisé par Apple)
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
      expires_in: 15552000, // 180 jours en secondes
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