// ======================================================
// DeepDiet - Result Page Logic
// Includes:
// - Auth
// - Dish slider
// - PDF export
// - Backend AI Chatbot (Gemini)
// ======================================================

requireAuth();
renderUserInfo();
applyI18n();

// Language selector
const langSelect = document.getElementById("langSelect");
if (langSelect) {
  langSelect.value = getLang();
  langSelect.addEventListener("change", () => setLang(langSelect.value));
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutUser();
    showToast("Logged out", "info");
    setTimeout(() => window.location.href = "login.html", 700);
  });
}

// ======================================================
// LOAD CURRENT SCAN
// ======================================================

const HISTORY_KEY = userKey("deepdiet_history");
const CURRENT_KEY = userKey("deepdiet_current_scan");

const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
const scanId = localStorage.getItem(CURRENT_KEY);

// IMPORTANT: let (not const)
let scan = history.find(s => String(s.id) === String(scanId));

function updateTotalsUI(totals) {
  document.getElementById("calories").textContent = totals?.calories ?? "--";
  document.getElementById("protein").textContent = totals?.protein_g ?? "--";
  document.getElementById("carbs").textContent = totals?.carbs_g ?? "--";
  document.getElementById("fat").textContent = totals?.fat_g ?? "--";
}

function saveScan(updatedScan) {
  const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const pos = hist.findIndex(s => String(s.id) === String(updatedScan.id));
  if (pos >= 0) {
    hist[pos] = updatedScan;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  }
}

if (!scan) {
  showToast("No scan found", "error");
} else {

  updateTotalsUI(scan.totals);

  // ======================================================
  // DISH MODE
  // ======================================================

  if (scan.dish_level) {

    document.getElementById("dishPanel").style.display = "block";

    const gramsBase = Number(scan.dish_meta?.estimated_grams || 300);
    const confidence = Number(scan.dish_meta?.confidence || 0);

    document.getElementById("dishNameBadge").textContent =
      `Dish: ${scan.meal_name}`;

    document.getElementById("portionBadge").textContent =
      `Portion: ${scan.dish_meta?.portion_label || "--"}`;

    document.getElementById("gramsBadge").textContent =
      `Estimated: ${gramsBase} g`;

    document.getElementById("confidenceBadge").textContent =
      `Confidence: ${confidence}%`;

    document.getElementById("dishNotes").textContent =
      scan.dish_meta?.notes ? `Notes: ${scan.dish_meta.notes}` : "";

    const baseTotals = { ...scan.totals };

    const slider = document.getElementById("portionSlider");
    const sliderText = document.getElementById("sliderText");

    slider.addEventListener("input", () => {

      const mult = Number(slider.value);
      sliderText.textContent = `Multiplier: ${mult}x`;

      document.getElementById("gramsBadge").textContent =
        `Estimated: ${Math.round(gramsBase * mult)} g`;

      scan.totals = {
        calories: Math.round((baseTotals.calories || 0) * mult),
        protein_g: Math.round((baseTotals.protein_g || 0) * mult * 10) / 10,
        carbs_g: Math.round((baseTotals.carbs_g || 0) * mult * 10) / 10,
        fat_g: Math.round((baseTotals.fat_g || 0) * mult * 10) / 10
      };

      updateTotalsUI(scan.totals);
      saveScan(scan);
    });
  }

  // ======================================================
  // ITEMS TABLE
  // ======================================================

  const tbody = document.getElementById("itemsTable");
  tbody.innerHTML = "";

  if (!scan.items || scan.items.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="3">Dish-level scan. No individual items.</td></tr>`;
  } else {
    scan.items.forEach(it => {
      const tr = document.createElement("tr");
      const qty = it.portion_text ||
        (it.quantity_value
          ? `${it.quantity_value} ${it.quantity_unit}`
          : "-");

      tr.innerHTML = `
        <td>${it.name}</td>
        <td>${qty}</td>
        <td>${it.calories || 0}</td>
      `;

      tbody.appendChild(tr);
    });
  }
}

// ======================================================
// PDF EXPORT
// ======================================================

document.getElementById("downloadBtn")
  .addEventListener("click", () => {

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text("DeepDiet Scan Report", 14, 18);

  pdf.setFontSize(11);
  pdf.text(`Meal: ${scan?.meal_name || "--"}`, 14, 30);

  if (scan?.dish_level) {
    pdf.text(`Dish mode: Restaurant`, 14, 38);
    pdf.text(`Estimated grams: ${scan.dish_meta?.estimated_grams || "--"}`, 14, 46);
    pdf.text(`Portion: ${scan.dish_meta?.portion_label || "--"}`, 14, 54);
  }

  pdf.text(`Calories: ${scan?.totals?.calories ?? 0}`, 14, 70);
  pdf.text(`Protein: ${scan?.totals?.protein_g ?? 0} g`, 14, 78);
  pdf.text(`Carbs: ${scan?.totals?.carbs_g ?? 0} g`, 14, 86);
  pdf.text(`Fat: ${scan?.totals?.fat_g ?? 0} g`, 14, 94);

  pdf.save("deepdiet-report.pdf");
  showToast("PDF downloaded ✅", "success");
});


// ======================================================
// 🤖 GEMINI BACKEND CHATBOT
// ======================================================

const toggle = document.getElementById("chatbotToggle");
const chatBox = document.getElementById("chatbotBox");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// Toggle chatbot
if (toggle) {
  toggle.addEventListener("click", () => {
    chatBox.style.display =
      chatBox.style.display === "flex" ? "none" : "flex";
  });
}

// Add message bubble
function addChatMessage(text, type = "bot") {
  const div = document.createElement("div");
  div.style.marginBottom = "8px";
  div.style.padding = "8px";
  div.style.borderRadius = "12px";
  div.style.fontSize = "13px";
  div.style.background =
    type === "user"
      ? "rgba(59,130,246,0.2)"
      : "rgba(34,197,94,0.2)";

  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send to backend
async function sendChatMessage() {

  const message = chatInput.value.trim();
  if (!message) return;

  addChatMessage(message, "user");
  chatInput.value = "";

  try {
    const res = await fetch("https://deepdiet-backend.onrender.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        context: scan || {}
      })
    });

    const data = await res.json();
    addChatMessage(data.reply || "No response", "bot");

  } catch (err) {
    console.error(err);
    addChatMessage("Server error. Is backend running?", "bot");
  }
}

if (chatSend) {
  chatSend.addEventListener("click", sendChatMessage);
}

if (chatInput) {
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });
}