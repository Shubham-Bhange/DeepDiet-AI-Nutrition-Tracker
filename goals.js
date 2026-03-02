function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function loadGoal(goalKey) {
  return Number(localStorage.getItem(goalKey) || 0);
}

function calcTodayCalories(history) {
  const today = todayKey();
  let sum = 0;
  history.forEach(s => {
    const d = new Date(s.timestamp);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (k === today) sum += Number(s.totals?.calories || 0);
  });
  return sum;
}

function calcStreak(history) {
  // streak = continuous days with at least 1 scan
  const days = new Set();
  history.forEach(s => {
    const d = new Date(s.timestamp);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    days.add(k);
  });

  let streak = 0;
  const d = new Date();
  while (true) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (days.has(k)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
