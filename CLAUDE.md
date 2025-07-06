# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple web-based chatbot application that integrates with Google's Gemini API. The project consists of three main files:

- `index.html` - Main HTML structure with chatbot UI
- `script.js` - JavaScript functionality for chat interactions and API calls
- `style.css` - Styling for the chatbot interface

## Architecture

The application follows a straightforward client-side architecture:

1. **DOM Manipulation**: Uses vanilla JavaScript to handle UI interactions
2. **API Integration**: Makes HTTP requests to Google's Gemini API for chat responses
3. **Responsive Design**: CSS provides responsive layout for desktop and mobile devices

## Key Components

- **Chat Interface**: Fixed-position chatbot with toggle functionality
- **Message Handling**: Creates chat elements dynamically and manages user/bot messages
- **API Configuration**: Requires Google Gemini API key configuration in `script.js:11`
- **Error Handling**: Displays API errors in the chat interface

## Development Notes

- The application uses a serverless function proxy for secure API communication
- API key is configured via environment variables (not in frontend code)
- Uses Google Fonts for icons (Material Symbols)
- Responsive breakpoint at 490px for mobile optimization
- Source links are displayed below chat responses when available

## API Integration

The chatbot integrates with the IT Support API at `https://api.raffryrizqullah.com/chat`:
- Uses `/api/chat-proxy.js` serverless function as a secure proxy
- Requires `X-API-Key` header for authentication
- Expects responses with `answer`, `sources` array, `query`, and `source_count`
- Sources include `text`, `source`, `chunk_id`, and `score` fields
- Sources are displayed with relevance scores and text previews

## Environment Setup

1. **Local Development**: 
   - Copy `.env.local` and add your actual API key
   - Set `X_API_KEY=your_actual_api_key_here`

2. **Vercel Deployment**:
   - Set environment variable `X_API_KEY` in Vercel dashboard
   - Deploy directly from Git repository

## Development & Testing

### Local Development
- **Simple**: Open `index.html` in browser or live server (auto-detects dev mode)
- **With Serverless**: Use `vercel dev` for full serverless function testing
- **Environment**: Automatically switches between direct API calls (dev) and proxy (production)

### Production Testing
- Deploy to Vercel with `X_API_KEY` environment variable configured
- Test at your Vercel URL to verify serverless function integration

### Troubleshooting
- Check `DEVELOPMENT.md` for detailed troubleshooting guide
- Browser console shows environment detection and detailed error messages
- Development mode provides specific error guidance