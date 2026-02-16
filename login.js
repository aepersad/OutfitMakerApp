// Fake login: stores username locally and routes to app.html.
// Password is UI-only and ignored.

const PROFILE_KEY = "buildmyoutfit_profile_v1";

const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput"); // intentionally unused
const loginBtn = document.getElementById("loginBtn");
const guestBtn = document.getElementById("guestBtn");
const authMsg = document.getElementById("authMsg");

function makeProfileId(name) {
  const base = (name || "guest")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 24) || "guest";
  return `p_${base}`;
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function goToApp() {
  window.location.href = "app.html";
}

loginBtn.addEventListener("click", () => {
  const username = (usernameInput.value || "").trim();
  if (!username) {
    authMsg.textContent = "Enter a username.";
    return;
  }

  saveProfile({ id: makeProfileId(username), name: username });
  goToApp();
});

guestBtn.addEventListener("click", () => {
  saveProfile({ id: makeProfileId("guest"), name: "Guest" });
  goToApp();
});

// If profile exists, go straight to app
try {
  const existing = localStorage.getItem(PROFILE_KEY);
  if (existing) goToApp();
} catch {}
