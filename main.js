import { GoogleGenerativeAI } from "@google/generative-ai";

const businessInfo = `You are a friendly and encouraging motivational coach. Always respond positively and supportively, helping users feel inspired.`;

// ✅ Use your actual API key here
const API_KEY = "AIzaSyBzHTnvODeeH0tsEOIaJePDkN5yPWh-Jf";  // replace with your actual Gemini key

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: businessInfo
});

let messages = {
  history: [],
};

async function sendMessage() {
  const userInput = document.querySelector(".chat-window input");
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  try {
    // Display user message
    userInput.value = "";
    document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend", `
      <div class="user"><p>${userMessage}</p></div>
    `);

    // Loading indicator
    document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend", `
      <div class="loader">⏳</div>
    `);

    const chat = model.startChat(messages);
    const result = await chat.sendMessageStream(userMessage);

    // Display bot message
    document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend", `
      <div class="model"><p></p></div>
    `);

    const lastModelDiv = document.querySelectorAll(".chat-window .chat .model p");
    let fullResponse = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      lastModelDiv[lastModelDiv.length - 1].innerHTML += chunkText;
    }

    // Save to history
    messages.history.push({ role: "user", parts: [{ text: userMessage }] });
    messages.history.push({ role: "model", parts: [{ text: fullResponse }] });

    // 🔊 Speak response
    const utterance = new SpeechSynthesisUtterance(fullResponse);
    utterance.lang = "en-US";
    utterance.pitch = 1;
    utterance.rate = 1;
    speechSynthesis.speak(utterance);

  } catch (err) {
    console.error(err);
    document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend", `
      <div class="error"><p>⚠️ Error: Could not process your message.</p></div>
    `);
  }

  // Remove loader
  const loader = document.querySelector(".loader");
  if (loader) loader.remove();
}

// 🎤 Voice Input
const micButton = document.querySelector(".chat-window .mic");
micButton.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;
    document.querySelector(".chat-window input").value = voiceText;
    sendMessage(); // Auto send
  };

  recognition.onerror = (event) => {
    alert("Voice error: " + event.error);
  };
});

// 🧠 Send on click
document.querySelector(".chat-window .send").addEventListener("click", sendMessage);

// 🟢 Open Chat
document.querySelector(".chat-button").addEventListener("click", () => {
  document.body.classList.add("chat-open");
});

// 🔴 Close Chat
document.querySelector(".chat-window .close").addEventListener("click", () => {
  document.body.classList.remove("chat-open");
});
