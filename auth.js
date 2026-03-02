const USERS_KEY = "deepdiet_users";
const SESSION_KEY = "deepdiet_session";

function normalizeUserId(userId) {
  return String(userId || "").trim().toLowerCase();
}

function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}
function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

function registerUser({ userId, password, fullName }) {
  userId = normalizeUserId(userId);
  if (!userId || userId.length < 3) return { ok: false, msg: "User ID must be at least 3 characters." };
  if (!password || password.length < 4) return { ok: false, msg: "Password must be at least 4 characters." };

  const users = loadUsers();
  if (users.some(u => u.userId === userId)) return { ok: false, msg: "User ID already exists. Please login." };

  users.unshift({
    id: Date.now(),
    userId,
    fullName: fullName || "",
    password, // demo only
    createdAt: new Date().toISOString()
  });
  saveUsers(users);
  return { ok: true, msg: "Registered successfully ✅" };
}

function loginUser({ userId, password }) {
  userId = normalizeUserId(userId);
  const users = loadUsers();
  const user = users.find(u => u.userId === userId);
  if (!user) return { ok: false, msg: "User not found. Please register." };
  if (user.password !== password) return { ok: false, msg: "Invalid password." };

  setSession({
    userId: user.userId,
    fullName: user.fullName,
    loginAt: new Date().toISOString()
  });
  return { ok: true, msg: "Login successful ✅" };
}

function requireAuth() {
  const s = getSession();
  if (!s) window.location.href = "login.html";
  return s;
}

function renderUserInfo() {
  const s = getSession();
  const el = document.getElementById("userInfo");
  if (!el) return;
  el.textContent = s ? (s.fullName || s.userId) : "Guest";
}

function userKey(baseKey) {
  const s = getSession();
  return s ? `${baseKey}_${s.userId}` : `${baseKey}_guest`;
}
