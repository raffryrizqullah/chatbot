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

// Enhanced Markdown Parser with URL Detection
const parseMarkdown = (text) => {
  if (!text) return '';
  
  let html = text.trim();
  
  // Convert URLs to clickable links first (before other formatting)
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
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
  
  // Convert line breaks (double newlines to paragraph breaks, single to br)
  html = html.replace(/\n\n+/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  
  // Clean up any double br tags
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>');
  
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
  
  // Return integrated source link (no separate container)
  return `<br><br><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="source-link-integrated">📋 Sumber</a>`;
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
