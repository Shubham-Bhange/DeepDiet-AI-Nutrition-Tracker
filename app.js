// ================= AUTH CHECK =================
const API_BASE = "https://deepdiet-backend.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
  }
}

requireAuth();

// ================= UI =================
const dz = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const preview = document.getElementById("preview");
const scanBtn = document.getElementById("scanBtn");
const resetBtn = document.getElementById("resetBtn");
const loader = document.getElementById("loader");

let currentFile = null;

// ================= FILE HANDLING =================
function setFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file.");
    return;
  }

  currentFile = file;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";

  scanBtn.disabled = false;
  resetBtn.disabled = false;
}

browseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => setFile(e.target.files[0]));

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

resetBtn.addEventListener("click", () => {
  currentFile = null;
  preview.style.display = "none";
  preview.src = "";
  fileInput.value = "";
  scanBtn.disabled = true;
  resetBtn.disabled = true;
  loader.style.display = "none";
});

// ================= GEMINI SCAN =================
async function geminiDishScan(file) {
  const token = getToken();

  if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/dish-scan`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: form
  });

  if (res.status === 401) {
    alert("Session expired. Please login again.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Backend error");
  }

  return await res.json();
}

// ================= SCAN BUTTON =================
scanBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Upload image first");
    return;
  }

  loader.style.display = "block";
  scanBtn.disabled = true;

  try {
    const dish = await geminiDishScan(currentFile);

    // Save current scan in localStorage ONLY for result page display
    localStorage.setItem("deepdiet_current_scan", JSON.stringify(dish));

    window.location.href = "result.html";

  } catch (err) {
    console.error(err);
    alert("Scan failed. Please try again.");
  } finally {
    loader.style.display = "none";
    scanBtn.disabled = false;
  }
});