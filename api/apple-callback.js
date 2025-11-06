// api/apple-callback.js

export default async function handler(req, res) {
  // On n'accepte que les POST (Apple envoie en POST avec response_mode=form_post)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apple envoie les données dans req.body
    const { code, id_token, state, user } = req.body;

    // Vérifier que le code est présent
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // 🔍 DÉTECTER SI C'EST MOBILE VIA USER-AGENT
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

    // 📱 Choisir l'URL de redirection selon la plateforme
    const redirect_uri = isMobile
      ? 'webinti://apple-callback'  // Custom URL Scheme pour l'app mobile
      : 'https://app.webinti.com/version-test/apple-callback';  // URL web

    // 📦 Créer les paramètres à envoyer
    const params = new URLSearchParams({
      code: code,
      state: state || '',
    });

    // Ajouter id_token s'il existe (envoyé uniquement parfois par Apple)
    if (id_token) {
      params.append('id_token', id_token);
    }

    // Ajouter user s'il existe (envoyé uniquement lors de la première connexion)
    if (user) {
      // Convertir l'objet user en JSON string
      params.append('user', typeof user === 'string' ? user : JSON.stringify(user));
    }

    // 🎯 Construire l'URL de redirection complète
    const redirectUrl = `${redirect_uri}?${params.toString()}`;

    // 📊 Logs pour debug (vous pouvez voir ça dans Vercel Logs)
    console.log('=== Apple Callback ===');
    console.log('User-Agent:', userAgent);
    console.log('Is Mobile:', isMobile);
    console.log('Redirect URL:', redirectUrl);
    console.log('=====================');

    // 🔄 Redirection HTML (plus compatible que res.redirect pour form_post)
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Connecting to Apple...</title>
          <meta http-equiv="refresh" content="1;url=${redirectUrl}">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .loader {
              border: 4px solid rgba(255,255,255,0.3);
              border-top: 4px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            a {
              color: white;
              text-decoration: underline;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <h2>Redirecting to your app...</h2>
          <p>Please wait...</p>
          <p><a href="${redirectUrl}">Click here if you are not redirected automatically</a></p>
          <script>
            // Redirection immédiate
            setTimeout(() => {
              window.location.href = "${redirectUrl}";
            }, 500);
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error in Apple callback:', error);
    
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f44336;
              color: white;
            }
          </style>
        </head>
        <body>
          <h1>❌ Authentication Error</h1>
          <p>Something went wrong. Please try again.</p>
          <p><strong>Error:</strong> ${error.message}</p>
        </body>
      </html>
    `);
  }
}
