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
      console.error('Environment variables available:', Object.keys(process.env).filter(key => key.includes('API')));
      return res.status(500).json({ 
        error: 'API key not configured',
        debug: {
          hasXApiKey: !!process.env.X_API_KEY,
          envKeys: Object.keys(process.env).filter(key => key.includes('API')),
          message: 'Check Vercel environment variables configuration'
        }
      });
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
      
      // Special handling for 401 Unauthorized
      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'Authentication failed - Invalid API key',
          details: errorData,
          debug: {
            message: 'The API key provided is not valid or has expired',
            suggestion: 'Check if the API key is correct and still active',
            apiKeyLength: apiKey ? apiKey.length : 0,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
          }
        });
      }
      
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