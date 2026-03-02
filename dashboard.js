requireAuth();
renderUserInfo();
applyI18n();

// ================= LANGUAGE =================
const langSelect = document.getElementById("langSelect");
if (langSelect) {
  langSelect.value = getLang();
  langSelect.addEventListener("change", () => setLang(langSelect.value));
}

// ================= LOGOUT =================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutUser();
    showToast("Logged out", "info");
    setTimeout(() => window.location.href = "login.html", 600);
  });
}

// ================= KEYS =================
const HISTORY_KEY = userKey("deepdiet_history");
const GOAL_KEY = userKey("deepdiet_goal");
const WATER_GOAL_KEY = userKey("deepdiet_water_goal");
const WATER_DATA_KEY = userKey("deepdiet_water_data");

// ================= LOAD DATA =================
const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

// ================= CALORIE ELEMENTS =================
const goalBadge = document.getElementById("goalBadge");
const todayBadge = document.getElementById("todayBadge");
const remainBadge = document.getElementById("remainBadge");
const streakBadge = document.getElementById("streakBadge");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const goalInput = document.getElementById("goalInput");
const setGoalBtn = document.getElementById("setGoalBtn");

// ================= CALCULATIONS =================
const goal = loadGoal(GOAL_KEY);
const todayCal = calcTodayCalories(history);
const streak = calcStreak(history);

const remaining = goal > 0 ? Math.max(goal - todayCal, 0) : 0;
const pct = goal > 0 ? Math.min(Math.round((todayCal / goal) * 100), 100) : 0;

// ================= RENDER CALORIE SUMMARY =================
goalBadge.textContent = `Goal: ${goal > 0 ? goal : "--"} kcal`;
todayBadge.textContent = `Today: ${todayCal} kcal`;
remainBadge.textContent = `Remaining: ${goal > 0 ? remaining : "--"} kcal`;
streakBadge.textContent = `Streak: ${streak} days`;

progressFill.style.width = `${pct}%`;
progressText.textContent =
  goal > 0 ? `${pct}% of daily goal completed` : "Set goal to track progress";

if (goal > 0) goalInput.value = goal;

// ================= SET CALORIE GOAL =================
setGoalBtn.addEventListener("click", () => {
  const val = Number(goalInput.value || 0);
  if (!val || val < 500)
    return showToast("Enter valid goal (>= 500)", "error");

  localStorage.setItem(GOAL_KEY, String(val));
  showToast("Goal updated ✅", "success");
  setTimeout(() => location.reload(), 700);
});

// ================= CHARTS =================
const labels = history
  .slice(0, 15)
  .reverse()
  .map(s => new Date(s.timestamp).toLocaleDateString());

const calories = history
  .slice(0, 15)
  .reverse()
  .map(s => Number(s.totals?.calories || 0));

const scores = history
  .slice(0, 15)
  .reverse()
  .map(s => Number(s.health_score || 0));

new Chart(document.getElementById("calChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{ label: "Calories", data: calories, borderWidth: 2, tension: 0.3 }]
  },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

new Chart(document.getElementById("scoreChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{ label: "Health Score", data: scores, borderWidth: 2, tension: 0.3 }]
  },
  options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
});

// ========================================================
// ================= WATER TRACKER ========================
// ========================================================

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function loadWaterGoal() {
  return Number(localStorage.getItem(WATER_GOAL_KEY) || 0);
}

function loadWaterData() {
  const all = JSON.parse(localStorage.getItem(WATER_DATA_KEY) || "{}");
  return all[todayKey()] || 0;
}

function saveWaterData(val) {
  const all = JSON.parse(localStorage.getItem(WATER_DATA_KEY) || "{}");
  all[todayKey()] = val;
  localStorage.setItem(WATER_DATA_KEY, JSON.stringify(all));
}

function updateWaterUI() {
  const goal = loadWaterGoal();
  const today = loadWaterData();
  const remain = goal > 0 ? Math.max(goal - today, 0) : 0;

  document.getElementById("waterGoalBadge").textContent =
    `Goal: ${goal || 0} ml`;
  document.getElementById("waterTodayBadge").textContent =
    `Today: ${today} ml`;
  document.getElementById("waterRemainBadge").textContent =
    `Remaining: ${remain} ml`;
}

// ================= WATER BUTTONS =================
const setWaterGoalBtn = document.getElementById("setWaterGoalBtn");
const addWaterBtn = document.getElementById("addWaterBtn");
const resetWaterBtn = document.getElementById("resetWaterBtn");
const enableWaterNotifyBtn = document.getElementById("enableWaterNotifyBtn");

if (setWaterGoalBtn) {
  setWaterGoalBtn.addEventListener("click", () => {
    const val = Number(document.getElementById("waterGoalInput").value || 0);
    if (val < 500)
      return showToast("Enter valid water goal (>= 500 ml)", "error");

    localStorage.setItem(WATER_GOAL_KEY, String(val));
    showToast("Water goal updated 💧", "success");
    updateWaterUI();
  });
}

if (addWaterBtn) {
  addWaterBtn.addEventListener("click", () => {
    let today = loadWaterData();
    today += 250;
    saveWaterData(today);
    showToast("+250 ml added 💧", "success");
    updateWaterUI();
  });
}

if (resetWaterBtn) {
  resetWaterBtn.addEventListener("click", () => {
    saveWaterData(0);
    showToast("Water reset for today", "info");
    updateWaterUI();
  });
}

// ================= WATER NOTIFICATION =================
if (enableWaterNotifyBtn) {
  enableWaterNotifyBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      return showToast("Notifications not supported", "error");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return showToast("Notification permission denied", "error");
    }

    showToast("Hydration reminder enabled 💧", "success");

    setInterval(() => {
      new Notification("DeepDiet Hydration Reminder 💧", {
        body: "Time to drink water! Stay hydrated."
      });
    }, 60 * 60 * 1000); // every 1 hour
  });
}

// Initialize water UI
updateWaterUI();