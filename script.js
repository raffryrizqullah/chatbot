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

// Utility Functions
const parseMarkdown = (text) => {
  let html = text;
  html = html.replace(/### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  return html;
};

const separateAnswerFromContact = (fullAnswer) => {
  const contactPhrases = [
    'Jika masih membutuhkan bantuan lebih lanjut',
    'Untuk bantuan tambahan atau konsultasi lebih detail',
    'Apabila solusi di atas belum menyelesaikan masalah'
  ];
  
  let mainAnswer = fullAnswer;
  let contactInfo = '';
  
  for (const phrase of contactPhrases) {
    const contactIndex = fullAnswer.indexOf(phrase);
    if (contactIndex !== -1) {
      mainAnswer = fullAnswer.substring(0, contactIndex).trim();
      contactInfo = fullAnswer.substring(contactIndex).trim();
      break;
    }
  }
  
  return { mainAnswer, contactInfo };
};

const createSourcesHTML = (sources) => {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return '';
  }
  
  const validSources = sources.filter(source => 
    source.text && source.text.trim() && 
    ((Array.isArray(source.source) && source.source.length > 0) || 
     (source.source && source.source.trim()))
  );
  
  if (validSources.length === 0) return '';
  
  let sourcesHTML = `
    <div class="sources-section">
      <h4>📚 Sumber Referensi (${validSources.length}):</h4>
  `;
  
  validSources.forEach((source, index) => {
    let sourceUrls = [];
    let sourceTitle = '';
    
    if (Array.isArray(source.source)) {
      sourceUrls = source.source.filter(url => url && url.startsWith('http'));
      sourceTitle = 'Dokumen BSI UII';
    } else if (source.source && source.source !== 'unknown') {
      if (source.source.startsWith('http')) {
        sourceUrls = [source.source];
        sourceTitle = 'Dokumen Online';
      } else {
        sourceTitle = source.source;
      }
    } else {
      sourceTitle = `Sumber ${index + 1}`;
    }
    
    // Clean source text
    let cleanText = source.text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/RINGKASAN:\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const truncatedText = cleanText.length > 150 
      ? cleanText.substring(0, 150) + "..." 
      : cleanText;
    
    const scoreText = source.score ? `${(source.score * 100).toFixed(1)}%` : '';
    
    sourcesHTML += `
      <div class="source-item">
        <div class="source-header">
          ${sourceUrls.length > 0 
            ? `<a href="${sourceUrls[0]}" target="_blank" rel="noopener noreferrer" class="source-title">${sourceTitle}</a>`
            : `<span class="source-title">${sourceTitle}</span>`
          }
          ${scoreText ? `<span class="source-score">${scoreText}</span>` : ''}
        </div>
        <p class="source-text">${truncatedText}</p>
        ${sourceUrls.length > 0 ? createSourceLinksHTML(sourceUrls) : ''}
      </div>
    `;
  });
  
  sourcesHTML += '</div>';
  return sourcesHTML;
};

const createSourceLinksHTML = (urls) => {
  if (!urls || urls.length === 0) return '';
  
  let linksHTML = '<div class="source-links">';
  urls.forEach((url, index) => {
    let linkText = '';
    if (url.includes('bsi.uii.ac.id')) {
      linkText = url.includes('.pdf') ? '📄 Panduan PDF' : '🌐 Halaman Web BSI';
    } else {
      linkText = `🔗 Link ${index + 1}`;
    }
    
    linksHTML += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="source-link">${linkText}</a>`;
    if (index < urls.length - 1) {
      linksHTML += '<span class="link-separator"> • </span>';
    }
  });
  linksHTML += '</div>';
  return linksHTML;
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

const buildChatContent = (data) => {
  const fullAnswer = data.answer || data.message || 'No response received';
  const { mainAnswer, contactInfo } = separateAnswerFromContact(fullAnswer);
  
  let content = parseMarkdown(mainAnswer);
  
  const sourcesHTML = createSourcesHTML(data.sources);
  if (sourcesHTML) {
    content += sourcesHTML;
  }
  
  if (contactInfo) {
    content += `<div class="contact-section">${contactInfo}</div>`;
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
