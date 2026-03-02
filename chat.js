// ================= CHATBOT FOR RESULT PAGE =================

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

// Get current scan context
const HISTORY_KEY = userKey("deepdiet_history");
const CURRENT_KEY = userKey("deepdiet_current_scan");

const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
const scanId = localStorage.getItem(CURRENT_KEY);
const currentScan = history.find(s => String(s.id) === String(scanId));

function addMessage(text, type = "bot") {
  const div = document.createElement("div");
  div.style.marginBottom = "8px";
  div.style.padding = "8px 10px";
  div.style.borderRadius = "12px";
  div.style.fontSize = "14px";

  if (type === "user") {
    div.style.background = "rgba(59,130,246,0.15)";
    div.style.border = "1px solid rgba(59,130,246,0.35)";
    div.textContent = "You: " + text;
  } else {
    div.style.background = "rgba(34,197,94,0.15)";
    div.style.border = "1px solid rgba(34,197,94,0.35)";
    div.textContent = "AI: " + text;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  chatInput.value = "";

  try {
    const res = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        context: currentScan || {}
      })
    });

    const data = await res.json();
    addMessage(data.reply || "No response", "bot");

  } catch (err) {
    console.error(err);
    addMessage("Server error. Is backend running?", "bot");
  }
}

chatSendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});