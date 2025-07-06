export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // Get API key from environment variable
    const apiKey = process.env.X_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Forward request to your API
    const response = await fetch('https://api.raffryrizqullah.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API request failed: ${response.status} - ${errorData}`);
      return res.status(response.status).json({ 
        error: `API request failed: ${response.status}`,
        details: errorData,
        debug: {
          url: 'https://api.raffryrizqullah.com/chat',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey ? 'present' : 'missing'
          },
          body: { message }
        }
      });
    }

    const data = await response.json();
    
    // Forward the response back to the frontend
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      debug: {
        apiKey: process.env.X_API_KEY ? 'configured' : 'missing',
        message: message || 'undefined'
      }
    });
  }
}