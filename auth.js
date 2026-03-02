// ================= JWT AUTH SYSTEM =================

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

function renderUserInfo() {
  const name = localStorage.getItem("fullName") || "User";
  const el = document.getElementById("userInfo");
  if (el) el.textContent = name;
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("fullName");
}

function userKey(baseKey) {
  const name = localStorage.getItem("fullName") || "user";
  return `${baseKey}_${name}`;
}