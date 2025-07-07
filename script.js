const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null; // Variable to store user's message
const inputInitHeight = chatInput.scrollHeight;

// Environment detection and API configuration
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('localhost') ||
                     window.location.protocol === 'file:';

const API_URL = isDevelopment ? "https://api.raffryrizqullah.com/chat" : "/api/chat-proxy";

console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('API URL:', API_URL);

const createChatLi = (message, className) => {
  // Create a chat <li> element with passed message and className
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi; // return chat <li> element
};

// Helper function to check if text is already inside a link
const isInsideLink = (text, match, startIndex) => {
  // Look backwards from match position to find if we're inside <a> tag
  const beforeMatch = text.substring(0, startIndex);
  const lastOpenTag = beforeMatch.lastIndexOf('<a ');
  const lastCloseTag = beforeMatch.lastIndexOf('</a>');
  
  // If there's an open <a> tag after the last close tag, we're inside a link
  return lastOpenTag > lastCloseTag;
};

// Smart URL shortening for better readability
const shortenURL = (url) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Handle different URL lengths
    if (url.length <= 30) {
      return url; // Short URLs displayed as-is
    }
    
    // Long URLs show domain with ellipsis
    return `${domain}...`;
  } catch (e) {
    // Fallback for invalid URLs
    return url.length > 30 ? url.substring(0, 30) + '...' : url;
  }
};

// Comprehensive Link and Email Detection
const convertLinksToHTML = (text) => {
  let html = text;
  
  // Step 1: Convert email addresses first (to avoid conflict with domain detection)
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  html = html.replace(emailRegex, (match, p1, offset) => {
    if (isInsideLink(html, match, offset)) return match;
    return `<a href="mailto:${match}" class="email-link">📧 ${match}</a>`;
  });
  
  // Step 2: Convert URLs with protocol (http/https)
  const urlWithProtocolRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]()]+)/gi;
  html = html.replace(urlWithProtocolRegex, (match, p1, offset) => {
    if (isInsideLink(html, match, offset)) return match;
    // Clean URL (remove trailing punctuation if not part of URL)
    const cleanUrl = match.replace(/[.,;:!?]$/, '');
    const trailingPunc = match.substring(cleanUrl.length);
    const displayText = shortenURL(cleanUrl);
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" title="${cleanUrl}">${displayText}</a>${trailingPunc}`;
  });
  
  // Step 3: Convert www URLs (add https://)
  const wwwUrlRegex = /(^|[\s\n])(www\.[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]()]*)?)/gi;
  html = html.replace(wwwUrlRegex, (match, prefix, url, offset) => {
    if (isInsideLink(html, match, offset) || match.includes('@')) return match;
    // Clean URL
    const cleanUrl = url.replace(/[.,;:!?]$/, '');
    const trailingPunc = url.substring(cleanUrl.length);
    const fullUrl = `https://${cleanUrl}`;
    const displayText = shortenURL(fullUrl);
    return `${prefix}<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" title="${fullUrl}">${displayText}</a>${trailingPunc}`;
  });
  
  // Step 4: Convert standalone domain URLs (be very careful with false positives)
  const domainUrlRegex = /(^|[\s\n])([a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]()]*)?)/gi;
  html = html.replace(domainUrlRegex, (match, prefix, domain, offset) => {
    // Skip if already converted, contains @, or looks like email
    if (isInsideLink(html, match, offset) || match.includes('@') || domain.includes('@')) return match;
    
    // Skip common false positives
    const falsePositives = /\.(js|css|html|txt|pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|svg|mp4|mp3|avi|zip|rar|tar|gz)$/i;
    if (falsePositives.test(domain)) return match;
    
    // Skip if it's likely a file path, version number, or IP address
    if (domain.match(/^[\d.]+$/) || domain.includes('..') || domain.startsWith('.')) return match;
    
    // Must have valid TLD and reasonable domain structure
    const validTLD = /\.(com|org|net|edu|gov|mil|int|co|id|ac|go|or|my|sg|th|ph|vn|in|au|uk|de|fr|jp|cn|ru|br|mx|ca|us|info|biz|name|pro|tech|io|app|dev|cloud|online|site|store|blog|news|tv|fm|am|ly|me|cc|tw|kr|hk|asia|mobi|travel|museum|aero|jobs|cat|tel|xxx|post|geo|xxx|arpa)$/i;
    if (!validTLD.test(domain)) return match;
    
    // Skip single character domains or obviously invalid patterns
    const domainParts = domain.split('.');
    if (domainParts[0].length < 2 || domain.includes('--')) return match;
    
    // Clean domain
    const cleanDomain = domain.replace(/[.,;:!?]$/, '');
    const trailingPunc = domain.substring(cleanDomain.length);
    
    return `${prefix}<a href="https://${cleanDomain}" target="_blank" rel="noopener noreferrer">${cleanDomain}</a>${trailingPunc}`;
  });
  
  return html;
};

// Convert Markdown Elements
const convertMarkdownElements = (html) => {
  // Convert headers (### ## #) to HTML
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bold text (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert numbered lists with improved regex
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Convert bullet points (- * +)
  html = html.replace(/^[\-\*\+]\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items properly
  html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, (match) => {
    // Check if this is part of numbered list context
    const beforeMatch = html.substring(0, html.indexOf(match));
    const hasNumberedContext = /\d+\.\s+[^<]*$/.test(beforeMatch.split('\n').pop() || '');
    
    if (hasNumberedContext || match.includes('1.') || match.includes('2.')) {
      return '<ol>' + match + '</ol>';
    } else {
      return '<ul>' + match + '</ul>';
    }
  });
  
  return html;
};

// Handle Line Breaks and Cleanup
const handleLineBreaks = (html) => {
  // Convert line breaks (double newlines to paragraph breaks, single to br)
  html = html.replace(/\n\n+/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  
  // Clean up any excessive br tags
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>');
  
  return html;
};

// Enhanced Markdown Parser with Comprehensive Link Detection
const parseMarkdown = (text) => {
  if (!text) return '';
  
  let html = text.trim();
  
  // Step 1: Convert all types of links and emails FIRST
  html = convertLinksToHTML(html);
  
  // Step 2: Convert markdown elements
  html = convertMarkdownElements(html);
  
  // Step 3: Handle line breaks and cleanup
  html = handleLineBreaks(html);
  
  return html;
};


// iMessage-style integrated source display
const createSourcesHTML = (sources) => {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return '';
  }
  
  // Find the source with highest score
  const bestSource = sources
    .filter(source => source.text && source.text.trim())
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  
  if (!bestSource) return '';
  
  // Get the first valid URL
  let sourceUrl = '';
  if (Array.isArray(bestSource.source)) {
    sourceUrl = bestSource.source.find(url => url && url.startsWith('http'));
  } else if (bestSource.source && bestSource.source.startsWith('http')) {
    sourceUrl = bestSource.source;
  }
  
  if (!sourceUrl) return '';
  
  // Return dengan elegant separator dan container
  return `<hr class="source-separator"><div class="source-container"><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="source-link-integrated">📋 Sumber</a></div>`;
};


const generateResponse = async (chatElement) => {
  const messageElement = chatElement.querySelector("p");
  
  try {
    const data = await fetchChatResponse();
    const content = buildChatContent(data);
    messageElement.innerHTML = content;
  } catch (error) {
    handleChatError(messageElement, error);
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};

const fetchChatResponse = async () => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage }),
  };

  if (isDevelopment) {
    requestOptions.headers["X-API-Key"] = "OVt6UWQUVyPrd0EPMDLPtIsVVnqfTT0dEmPTwpfz1xYYUCIApwxQzHCqKV70pHdzl9JiW8D7wREcUsMJ7pLXgYOuHRF9QLStwQm0uvsUPzdaZBcX6hwygVZC4DTJSm7n";
  }

  const response = await fetch(API_URL, requestOptions);
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Server returned non-JSON response. Status: ${response.status}. This might be a CORS error in development mode.`);
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `API request failed with status ${response.status}`);
  }
  
  return data;
};

// Streamlined content builder
const buildChatContent = (data) => {
  const answer = data.answer || data.message || 'Maaf, tidak ada respons yang diterima.';
  
  // Parse markdown to clean HTML
  let content = parseMarkdown(answer);
  
  // Add single source link if available
  const sourcesHTML = createSourcesHTML(data.sources);
  if (sourcesHTML) {
    content += sourcesHTML;
  }
  
  return content;
};

const handleChatError = (messageElement, error) => {
  messageElement.classList.add("error");
  
  let errorMessage = error.message || 'An error occurred while processing your request';
  
  if (error.message.includes('401') || error.message.includes('Authentication failed')) {
    errorMessage = '🔑 Authentication Error: API key is invalid or not configured properly in Vercel environment variables.';
  } else if (isDevelopment && error.message.includes('CORS')) {
    errorMessage += '\n\n🔧 Development Mode: Try using Vercel CLI with "vercel dev" for proper serverless function testing, or check API CORS settings.';
  }
  
  console.error('Chat API Error:', error);
  console.error('Environment:', isDevelopment ? 'Development' : 'Production');
  console.error('API URL:', API_URL);
  
  messageElement.textContent = errorMessage;
};

const handleChat = () => {
  userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
  if (!userMessage) return;

  // Clear the input textarea and set its height to default
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  // Append the user's message to the chatbox
  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    // Display "Thinking..." message while waiting for the response
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    generateResponse(incomingChatLi);
  }, 600);
};

chatInput.addEventListener("input", () => {
  // Adjust the height of the input textarea based on its content
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  // If Enter key is pressed without Shift key and the window
  // width is greater than 800px, handle the chat
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
