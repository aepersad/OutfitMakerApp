const PROFILE_KEY = "buildmyoutfit_profile_v1";
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const guestBtn = document.getElementById("guestBtn");
const authMsg = document.getElementById("authMsg");
function setAuthMsg(text) {
  authMsg.textContent = text || "";
}
function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
function getSavedProfiles() {
  return safeParse(localStorage.getItem("buildmyoutfit_users_v1"), []);
}
function saveProfiles(profiles) {
  localStorage.setItem("buildmyoutfit_users_v1", JSON.stringify(profiles));
}
function goToApp() {
  location.href = "app.html";
}
function createProfile(name, password, isGuest = false) {
  return {
    id: isGuest ? "guest" : `user_${name.toLowerCase()}`,
    name,
    password,
    isGuest,
  };
}
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  setAuthMsg("");
  if (!username || !password) {
    setAuthMsg("Please enter a username and password.");
    return;
  }
  const profiles = getSavedProfiles();
  const existing = profiles.find(
    (profile) => profile.name.toLowerCase() === username.toLowerCase()
  );
  if (existing) {
    if (existing.password !== password) {
      setAuthMsg("Incorrect password.");
      return;
    }
    saveProfile(existing);
    goToApp();
    return;
  }
  const newProfile = createProfile(username, password, false);
  profiles.push(newProfile);
  saveProfiles(profiles);
  saveProfile(newProfile);
  goToApp();
});
guestBtn.addEventListener("click", () => {
  const guestProfile = createProfile("Guest", "", true);
  saveProfile(guestProfile);
  goToApp();
});
[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      loginBtn.click();
    }
  });
});
