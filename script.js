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

const generateResponse = async (chatElement) => {
  const messageElement = chatElement.querySelector("p");

  // Define the properties and message for the API request
  const requestOptions = {
    method: "POST",
    headers: { 
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: userMessage
    }),
  };

  // Add API key header for direct API calls in development
  if (isDevelopment) {
    requestOptions.headers["X-API-Key"] = "OVt6UWQUVyPrd0EPMDLPtIsVVnqfTT0dEmPTwpfz1xYYUCIApwxQzHCqKV70pHdzl9JiW8D7wREcUsMJ7pLXgYOuHRF9QLStwQm0uvsUPzdaZBcX6hwygVZC4DTJSm7n";
  }

  // Send POST request to API, get response and set the response as paragraph text
  try {
    const response = await fetch(API_URL, requestOptions);
    
    // Handle non-JSON responses (like CORS errors)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. This might be a CORS error in development mode.`);
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `API request failed with status ${response.status}`);

    // Get the API response text and update the message element
    messageElement.textContent = data.answer || data.message || 'No response received';
    
    // Handle sources if they exist
    if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
      const sourcesContainer = document.createElement("div");
      sourcesContainer.className = "sources-container";
      
      const sourcesTitle = document.createElement("p");
      sourcesTitle.textContent = `Sources (${data.source_count || data.sources.length}):`;
      sourcesTitle.className = "sources-title";
      sourcesContainer.appendChild(sourcesTitle);
      
      data.sources.forEach((source, index) => {
        const sourceItem = document.createElement("div");
        sourceItem.className = "source-item";
        
        // Create source link/title
        const sourceLink = document.createElement("span");
        sourceLink.className = "source-link";
        sourceLink.textContent = source.source || `Source ${index + 1}`;
        
        // Create source text preview
        const sourceText = document.createElement("p");
        sourceText.className = "source-text";
        const truncatedText = source.text && source.text.length > 150 
          ? source.text.substring(0, 150) + "..." 
          : source.text || "No preview available";
        sourceText.textContent = truncatedText;
        
        // Create score indicator if available
        if (source.score !== undefined) {
          const scoreIndicator = document.createElement("span");
          scoreIndicator.className = "source-score";
          scoreIndicator.textContent = `${(source.score * 100).toFixed(1)}%`;
          sourceLink.appendChild(scoreIndicator);
        }
        
        sourceItem.appendChild(sourceLink);
        sourceItem.appendChild(sourceText);
        sourcesContainer.appendChild(sourceItem);
      });
      
      // Insert sources after the message
      chatElement.appendChild(sourcesContainer);
    }
  } catch (error) {
    // Handle error
    messageElement.classList.add("error");
    
    // More specific error messages
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
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
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
