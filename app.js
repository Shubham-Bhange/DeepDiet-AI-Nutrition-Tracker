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

// Keys
const HISTORY_KEY = userKey("deepdiet_history");

// UI Elements
const dz = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const preview = document.getElementById("preview");
const scanBtn = document.getElementById("scanBtn");
const resetBtn = document.getElementById("resetBtn");
const loader = document.getElementById("loader");

let currentFile = null;

// Set file handler
function setFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please upload an image file.", "error");
    return;
  }

  currentFile = file;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";

  scanBtn.disabled = false;
  resetBtn.disabled = false;

  showToast("Image selected ✅", "success");
}

// Browse click
browseBtn.addEventListener("click", () => fileInput.click());

// Input change
fileInput.addEventListener("change", (e) => setFile(e.target.files[0]));

// Drag & drop
dz.addEventListener("dragover", (e) => {
  e.preventDefault();
  dz.classList.add("dragover");
});
dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("dragover");
  setFile(e.dataTransfer.files[0]);
});

// Reset
resetBtn.addEventListener("click", () => {
  currentFile = null;
  preview.style.display = "none";
  preview.src = "";
  fileInput.value = "";

  scanBtn.disabled = true;
  resetBtn.disabled = true;
  loader.style.display = "none";

  showToast("Reset done", "info");
});

// Gemini dish scan API call
async function geminiDishScan(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("http://127.0.0.1:8000/api/dish-scan", {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Backend error");
  }

  return await res.json();
}

// Scan button — ALWAYS Gemini
scanBtn.addEventListener("click", async () => {
  if (!currentFile) return showToast("Upload image first", "error");

  loader.style.display = "block";
  scanBtn.disabled = true;

  try {
    showToast("AI scanning dish...", "info");

    // ✅ Call Gemini backend
    const dish = await geminiDishScan(currentFile);
    const nutr = dish.nutrition || {};

    // ✅ create scan object
    const scan = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      meal_name: dish.dish_name || "Unknown Dish",
      dish_level: true,

      dish_meta: {
        portion_label: dish.portion_label || "medium",
        estimated_grams: Number(dish.estimated_grams || 300),
        confidence: Number(dish.confidence || 0),
        notes: dish.notes || ""
      },

      totals: {
        calories: Number(nutr.calories || 0),
        protein_g: Number(nutr.protein_g || 0),
        carbs_g: Number(nutr.carbs_g || 0),
        fat_g: Number(nutr.fat_g || 0),
        fiber_g: Number(nutr.fiber_g || 0),
        sugar_g: Number(nutr.sugar_g || 0),
        sodium_mg: Number(nutr.sodium_mg || 0)
      },

      // ✅ IMPORTANT: save detected items
      items: Array.isArray(dish.items) ? dish.items : [],

      health_score: 70
    };

    // ✅ save to localStorage history
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    history.unshift(scan);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // ✅ store current scan id
    localStorage.setItem(userKey("deepdiet_current_scan"), String(scan.id));

    showToast("Scan completed ✅", "success");

    // ✅ go to result page
    window.location.href = "result.html";

  } catch (err) {
    console.error(err);
    showToast("Scan failed! Make sure backend is running.", "error");
  } finally {
    loader.style.display = "none";
    scanBtn.disabled = false;
  }
});
