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
    setTimeout(() => window.location.href = "login.html", 600);
  });
}

// Keys
const HISTORY_KEY = userKey("deepdiet_history");
const GOAL_KEY = userKey("deepdiet_goal");

// Load data
const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
const goal = Number(localStorage.getItem(GOAL_KEY) || 0);

function sum(arr) { return arr.reduce((a,b)=>a+b,0); }

// Date range
const now = new Date();
const last7Start = new Date();
last7Start.setDate(now.getDate() - 6);

const prev7Start = new Date();
prev7Start.setDate(now.getDate() - 13);

const prev7End = new Date();
prev7End.setDate(now.getDate() - 7);

// filter last 7 & previous 7
const last7 = history.filter(s => {
  const d = new Date(s.timestamp);
  return d >= last7Start && d <= now;
});
const prev7 = history.filter(s => {
  const d = new Date(s.timestamp);
  return d >= prev7Start && d <= prev7End;
});

// KPI calculations
const cal7 = sum(last7.map(s => Number(s.totals?.calories || 0)));
const avg7 = Math.round(cal7 / 7);
const score7 = last7.length ? Math.round(sum(last7.map(s => Number(s.health_score || 0))) / last7.length) : 0;

document.getElementById("wkCal").textContent = cal7;
document.getElementById("wkAvg").textContent = avg7;
document.getElementById("wkScore").textContent = score7;
document.getElementById("wkScans").textContent = last7.length;

// comparison
const calPrev = sum(prev7.map(s => Number(s.totals?.calories || 0)));
const avgPrev = prev7.length ? Math.round(calPrev / 7) : 0;

let compareMsg = "No previous week data";
if (avgPrev > 0) {
  const diff = avg7 - avgPrev;
  const pct = Math.round((diff / avgPrev) * 100);
  compareMsg = diff < 0
    ? `Improved ✅ ${Math.abs(pct)}% less calories vs last week`
    : `Increased ⚠️ ${pct}% calories vs last week`;
}
document.getElementById("compareBadge").textContent = compareMsg;

// ===== Charts: per day totals =====
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const days = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date();
  d.setDate(now.getDate() - i);
  days.push(d);
}

const labels = days.map(d => d.toLocaleDateString());

// day calories + day score
const dayCalories = days.map(d => {
  const key = dateKey(d);
  const scans = last7.filter(s => dateKey(new Date(s.timestamp)) === key);
  return sum(scans.map(s => Number(s.totals?.calories || 0)));
});

const dayScores = days.map(d => {
  const key = dateKey(d);
  const scans = last7.filter(s => dateKey(new Date(s.timestamp)) === key);
  if (!scans.length) return 0;
  return Math.round(sum(scans.map(s => Number(s.health_score || 0))) / scans.length);
});

// calories chart
new Chart(document.getElementById("wkCalChart"), {
  type: "bar",
  data: {
    labels,
    datasets: [{ label: "Calories", data: dayCalories, borderWidth: 1 }]
  },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

// score chart
new Chart(document.getElementById("wkScoreChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{ label: "Health Score", data: dayScores, borderWidth: 2, tension: 0.35 }]
  },
  options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
});

// ===== Best/Worst meal =====
let best = null, worst = null;
last7.forEach(s => {
  if (!best || Number(s.health_score || 0) > Number(best.health_score || 0)) best = s;
  if (!worst || Number(s.health_score || 0) < Number(worst.health_score || 0)) worst = s;
});

document.getElementById("bestMeal").textContent = best
  ? `${best.meal_name} (Score: ${best.health_score}, Calories: ${best.totals?.calories || 0})`
  : "--";

document.getElementById("worstMeal").textContent = worst
  ? `${worst.meal_name} (Score: ${worst.health_score}, Calories: ${worst.totals?.calories || 0})`
  : "--";

// ===== Top foods =====
const foodCount = {};
last7.forEach(s => {
  (s.items || []).forEach(it => {
    const name = String(it.name || "Unknown").trim();
    foodCount[name] = (foodCount[name] || 0) + 1;
  });
});

const topFoods = Object.entries(foodCount)
  .sort((a,b)=>b[1]-a[1])
  .slice(0,5);

const topFoodsTable = document.getElementById("topFoodsTable");
topFoodsTable.innerHTML = "";

if (!topFoods.length) {
  topFoodsTable.innerHTML = `<tr><td colspan="2">No data</td></tr>`;
} else {
  topFoods.forEach(([food, count]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${food}</td><td>${count}</td>`;
    topFoodsTable.appendChild(tr);
  });
}

// ======================= GOAL ACHIEVEMENT =======================
const daysMetEl = document.getElementById("daysMet");
const daysOverEl = document.getElementById("daysOver");
const avgRemainEl = document.getElementById("avgRemain");
const avgExcessEl = document.getElementById("avgExcess");
const goalSummaryBadge = document.getElementById("goalSummaryBadge");

let daysMet = 0, daysOver = 0;
let remainSum = 0, excessSum = 0;

if (goal > 0) {
  dayCalories.forEach(cal => {
    if (cal <= goal && cal > 0) {
      daysMet++;
      remainSum += (goal - cal);
    } else if (cal > goal) {
      daysOver++;
      excessSum += (cal - goal);
    }
  });

  const avgRemain = daysMet ? Math.round(remainSum / daysMet) : 0;
  const avgExcess = daysOver ? Math.round(excessSum / daysOver) : 0;

  daysMetEl.textContent = daysMet;
  daysOverEl.textContent = daysOver;
  avgRemainEl.textContent = avgRemain;
  avgExcessEl.textContent = avgExcess;

  goalSummaryBadge.textContent =
    daysMet >= daysOver
      ? `Good ✅ You met goal on ${daysMet} days`
      : `Warning ⚠️ You exceeded goal on ${daysOver} days`;
} else {
  daysMetEl.textContent = "--";
  daysOverEl.textContent = "--";
  avgRemainEl.textContent = "--";
  avgExcessEl.textContent = "--";
  goalSummaryBadge.textContent = "Set daily goal in Dashboard to see goal report";
}

// ======================= WEEKLY MACRO CHART =======================
const macroProtein = sum(last7.map(s => Number(s.totals?.protein_g || 0)));
const macroCarbs   = sum(last7.map(s => Number(s.totals?.carbs_g || 0)));
const macroFat     = sum(last7.map(s => Number(s.totals?.fat_g || 0)));

new Chart(document.getElementById("macroChart"), {
  type: "pie",
  data: {
    labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
    datasets: [{ data: [macroProtein, macroCarbs, macroFat], borderWidth: 1 }]
  },
  options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});

// ======================= SMART SUGGESTIONS =======================
const suggestions = [];

if (goal > 0 && avg7 > goal) suggestions.push("Try reducing daily calories by choosing low-oil foods and smaller portions.");
if (daysOver >= 4) suggestions.push("You exceeded your goal many days. Set reminders and avoid late-night snacks.");
if (score7 < 55) suggestions.push("Improve meal quality: add vegetables, reduce fried foods and sweets.");
if (macroProtein < macroCarbs * 0.25) suggestions.push("Increase protein: add dal, eggs, paneer, curd or sprouts.");
if (macroFat > macroCarbs * 0.9) suggestions.push("Fat intake seems high: reduce fried items and oil quantity.");
if (!last7.length) suggestions.push("No scans in last 7 days. Start scanning daily to track improvements.");

const suggestionsList = document.getElementById("suggestionsList");
suggestionsList.innerHTML = "";
(suggestions.length ? suggestions : ["Keep tracking! You're doing good ✅"]).slice(0, 6).forEach(txt => {
  const li = document.createElement("li");
  li.textContent = txt;
  suggestionsList.appendChild(li);
});

// ======================= WEEKLY PDF Export =======================
document.getElementById("weeklyPdfBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text("DeepDiet Weekly Report", 14, 18);

  pdf.setFontSize(11);
  pdf.text(`Total Calories: ${cal7}`, 14, 30);
  pdf.text(`Avg/day Calories: ${avg7}`, 14, 38);
  pdf.text(`Avg Health Score: ${score7}`, 14, 46);
  pdf.text(`Scans: ${last7.length}`, 14, 54);

  pdf.text(`Comparison: ${compareMsg}`, 14, 66);

  pdf.text(`Goal: ${goal > 0 ? goal : "--"} kcal/day`, 14, 78);
  if (goal > 0) {
    pdf.text(`Days met goal: ${daysMet}`, 14, 86);
    pdf.text(`Days exceeded: ${daysOver}`, 14, 94);
  }

  pdf.text("Macros (7 days):", 14, 108);
  pdf.text(`Protein: ${macroProtein} g`, 14, 116);
  pdf.text(`Carbs: ${macroCarbs} g`, 14, 124);
  pdf.text(`Fat: ${macroFat} g`, 14, 132);

  pdf.text("Best Meal:", 14, 146);
  pdf.text(best ? `${best.meal_name} (Score ${best.health_score})` : "--", 14, 154);

  pdf.text("Worst Meal:", 14, 166);
  pdf.text(worst ? `${worst.meal_name} (Score ${worst.health_score})` : "--", 14, 174);

  pdf.save("deepdiet-weekly-report.pdf");
  showToast("Weekly report PDF downloaded ✅", "success");
});
