import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    // 1. Générer le client_secret JWT
    const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const clientSecret = jwt.sign(
      {
        iss: process.env.APPLE_TEAM_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 mois
        aud: 'https://appleid.apple.com',
        sub: process.env.APPLE_CLIENT_ID,
      },
      privateKey,
      {
        algorithm: 'ES256',
        keyid: process.env.APPLE_KEY_ID,
      }
    );

    console.log('🔐 Client secret generated');

    // 2. Échanger le code contre un access_token
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.APPLE_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Apple token error:', tokenData);
      return res.status(400).json({ 
        error: 'Failed to exchange code', 
        details: tokenData 
      });
    }

    console.log('✅ Token exchange successful');

    // 3. Décoder l'id_token pour obtenir le sub (Apple User ID)
    const idTokenDecoded = jwt.decode(tokenData.id_token);

    console.log('👤 User ID:', idTokenDecoded.sub);
    console.log('📧 Email:', idTokenDecoded.email);

    return res.status(200).json({
      success: true,
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      apple_user_id: idTokenDecoded.sub,
      email: idTokenDecoded.email,
      email_verified: idTokenDecoded.email_verified === 'true',
    });

  } catch (error) {
    console.error('💥 Error exchanging code:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
