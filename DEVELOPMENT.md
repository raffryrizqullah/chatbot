# Development Guide

## Quick Start for Local Development

### Current Setup (Live Server/HTTP Server)
The chatbot now automatically detects development environment and makes direct API calls to avoid serverless function issues.

**Just open `index.html` in your browser or live server - it should work!**

### For Proper Serverless Function Testing

If you want to test the actual serverless functions locally:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Run Development Server**
   ```bash
   cd /path/to/chatbot/project
   vercel dev
   ```

4. **Access at:** `http://localhost:3000`

### Environment Detection

The chatbot automatically detects if it's running in:
- **Development**: `localhost`, `127.0.0.1`, or `file://` protocol
- **Production**: Vercel deployment

### Development Mode Features

When in development mode:
- Uses direct API calls to `https://api.raffryrizqullah.com/chat`
- Includes API key in headers automatically
- Shows detailed error messages with debugging info
- Provides CORS troubleshooting hints

### Production Mode Features

When deployed to Vercel:
- Uses `/api/chat-proxy` serverless function
- API key handled securely server-side
- Proper error handling without exposing sensitive info

## Environment Variables

### For Vercel Deployment
Set in Vercel dashboard:
```
X_API_KEY=your_actual_api_key_here
```

### For Local Development
API key is hardcoded in development mode for testing purposes.
**Never commit production API keys to git!**

## Troubleshooting

### 405 Method Not Allowed
- This happens when serverless functions aren't running
- Solution: Use `vercel dev` instead of live server

### CORS Errors in Development
- API server needs to allow your localhost origin
- Check browser console for detailed error messages
- Try different ports or use Vercel CLI

### "Server returned non-JSON response"
- Usually indicates CORS block or server error
- Check network tab in browser dev tools
- Verify API endpoint is accessible

## File Structure

```
chatbot/
├── api/
│   └── chat-proxy.js          # Serverless function (production)
├── index.html                 # Main HTML file
├── script.js                  # Main JavaScript (with environment detection)
├── style.css                  # Styles
├── vercel.json               # Vercel configuration
├── .env.local                # Environment variables (local)
└── DEVELOPMENT.md            # This file
```

## Testing Checklist

- [ ] Test in development mode (live server)
- [ ] Test with Vercel CLI (`vercel dev`)
- [ ] Deploy to Vercel and test production
- [ ] Verify API responses and source display
- [ ] Check error handling and user feedback