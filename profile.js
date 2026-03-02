requireAuth();
renderUserInfo();
applyI18n();

// Language selector
const langSelect = document.getElementById("langSelect");
if (langSelect) {
  langSelect.value = getLang();
  langSelect.addEventListener("change", () => setLang(langSelect.value));
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutUser();
    showToast("Logged out", "info");
    setTimeout(() => window.location.href = "login.html", 600);
  });
}

const PROFILE_KEY = userKey("deepdiet_profile");
const GOAL_KEY = userKey("deepdiet_goal");

function loadProfile() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
}

function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function renderSummary(p) {
  if (!p) return;

  const b = bmi(Number(p.weightKg), Number(p.heightCm));
  const b2 = Math.round(b * 10) / 10;

  document.getElementById("bmiBadge").textContent = `BMI: ${b2}`;
  document.getElementById("bmiCat").textContent = `Category: ${bmiCategory(b)}`;

  const rec = recommendedCalories(p);
  const mac = recommendedMacros(rec);

  document.getElementById("recCal").textContent = rec;
  document.getElementById("recP").textContent = mac.protein_g;
  document.getElementById("recC").textContent = mac.carbs_g;
  document.getElementById("recF").textContent = mac.fat_g;

  return rec;
}

// load existing profile
const existing = loadProfile();
if (existing) {
  document.getElementById("p_name").value = existing.name || "";
  document.getElementById("p_age").value = existing.age || "";
  document.getElementById("p_gender").value = existing.gender || "male";
  document.getElementById("p_height").value = existing.heightCm || "";
  document.getElementById("p_weight").value = existing.weightKg || "";
  document.getElementById("p_activity").value = existing.activity || "sedentary";
  renderSummary(existing);
}

document.getElementById("saveProfileBtn").addEventListener("click", () => {
  const p = {
    name: document.getElementById("p_name").value.trim(),
    age: Number(document.getElementById("p_age").value || 0),
    gender: document.getElementById("p_gender").value,
    heightCm: Number(document.getElementById("p_height").value || 0),
    weightKg: Number(document.getElementById("p_weight").value || 0),
    activity: document.getElementById("p_activity").value
  };

  if (!p.age || !p.heightCm || !p.weightKg) {
    return showToast("Please fill Age, Height, Weight", "error");
  }

  saveProfile(p);
  renderSummary(p);
  showToast("Profile saved ✅", "success");
});

document.getElementById("applyGoalBtn").addEventListener("click", () => {
  const p = loadProfile();
  if (!p) return showToast("Save profile first", "error");

  const rec = recommendedCalories(p);
  localStorage.setItem(GOAL_KEY, String(rec));
  showToast(`Goal set to ${rec} kcal/day ✅`, "success");
});
