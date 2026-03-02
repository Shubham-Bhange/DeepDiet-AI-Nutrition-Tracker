function showToast(message, type = "success") {
  const box = document.getElementById("toastBox");
  if (!box) return;

  const toast = document.createElement("div");

  let border = "rgba(34,197,94,0.35)";
  let bg = "rgba(34,197,94,0.10)";
  if (type === "error") { border = "rgba(239,68,68,0.35)"; bg = "rgba(239,68,68,0.12)"; }
  if (type === "info")  { border = "rgba(59,130,246,0.35)"; bg = "rgba(59,130,246,0.12)"; }
  if (type === "warn")  { border = "rgba(234,179,8,0.35)"; bg = "rgba(234,179,8,0.12)"; }

  toast.style.cssText = `
    padding:12px 14px;border-radius:16px;
    background:${bg};border:1px solid ${border};
    color:rgba(234,240,255,0.95);font-weight:900;
    backdrop-filter: blur(16px);
    box-shadow: 0 12px 35px rgba(0,0,0,0.35);
    transform: translateY(8px);opacity:0;transition: 0.25s;
  `;
  toast.textContent = message;
  box.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}
