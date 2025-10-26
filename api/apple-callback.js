export default async function handler(req, res) {
  // Vérifier que c'est bien un POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les données envoyées par Apple
    const { code, id_token, user, state, error } = req.body;

    // Si Apple a renvoyé une erreur
    if (error) {
      return res.redirect(
        `https://app.webinti.com/version-test/apple-callback?error=${error}`
      );
    }

    // Construire l'URL de redirection vers Bubble avec les données
    const bubbleUrl = new URL('https://app.webinti.com/version-test/apple-callback');
    
    if (code) bubbleUrl.searchParams.set('code', code);
    if (state) bubbleUrl.searchParams.set('state', state);
    if (id_token) bubbleUrl.searchParams.set('id_token', id_token);
    
    // Si l'utilisateur a partagé ses infos (premier login uniquement)
    if (user) {
      bubbleUrl.searchParams.set('user', user);
    }

    // Rediriger vers Bubble
    return res.redirect(302, bubbleUrl.toString());

  } catch (error) {
    console.error('Error in apple callback:', error);
    return res.redirect(
      `https://app.webinti.com/version-test/apple-callback?error=server_error`
    );
  }
}
