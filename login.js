// Fake login (password ignored)
const PROFILE_KEY = "buildmyoutfit_profile_v1";

const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const guestBtn = document.getElementById("guestBtn");
const authMsg = document.getElementById("authMsg");

function makeId(name) {
  return (
    "p_" +
    (name || "guest")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 24)
  );
}

loginBtn.addEventListener("click", () => {
  const name = (usernameInput.value || "").trim();
  if (!name) {
    authMsg.textContent = "Enter a username.";
    return;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ id: makeId(name), name }));
  location.href = "app.html";
});

guestBtn.addEventListener("click", () => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ id: "guest", name: "Guest" }));
  location.href = "app.html";
});
