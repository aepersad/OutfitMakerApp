const PROFILE_KEY = "outfitmatcher_profile_v5";

const displayNameInput = document.getElementById("displayNameInput");
const continueBtn = document.getElementById("continueBtn");
const continueGuestBtn = document.getElementById("continueGuestBtn");
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

continueBtn.addEventListener("click", () => {
  const name = (displayNameInput.value || "").trim();
  if (!name) {
    authMsg.textContent = "Enter a name or continue as guest.";
    return;
  }
  saveProfile({ id: makeProfileId(name), name });
  goToApp();
});

continueGuestBtn.addEventListener("click", () => {
  saveProfile({ id: makeProfileId("guest"), name: "Guest" });
  goToApp();
});

// If already set, go straight to app
try {
  const existing = localStorage.getItem(PROFILE_KEY);
  if (existing) goToApp();
} catch {}
