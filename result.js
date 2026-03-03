// ======================================================
// DeepDiet - Result Page (Backend Based)
// ======================================================

requireAuth();
renderUserInfo();
applyI18n();

const API = API_BASE;
const token = localStorage.getItem("token");

const currentScanId = localStorage.getItem("deepdiet_current_scan");

if (!currentScanId) {
  showToast("No scan found.", "error");
  setTimeout(() => window.location.href = "index.html", 800);
}

async function loadResult() {

  try {

    const res = await fetch(`${API}/api/history`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to load history");

    const history = await res.json();

    const scan = history.find(s => s.id === currentScanId);

    if (!scan) {
      showToast("Scan not found.", "error");
      return;
    }

    renderResult(scan);

  } catch (err) {
    console.error(err);
    showToast("Failed to load result.", "error");
  }
}

function renderResult(scan) {

  // Totals
  document.getElementById("caloriesValue").textContent =
    scan.totals?.calories || 0;

  document.getElementById("proteinValue").textContent =
    scan.totals?.protein_g || 0;

  document.getElementById("carbsValue").textContent =
    scan.totals?.carbs_g || 0;

  document.getElementById("fatValue").textContent =
    scan.totals?.fat_g || 0;

  // Items table
  const tbody = document.getElementById("itemsTableBody");
  tbody.innerHTML = "";

  (scan.items || []).forEach(item => {
    const row = `
      <tr>
        <td>${item.name}</td>
        <td>${item.portion_text}</td>
        <td>${item.calories}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

loadResult();