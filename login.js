const PROFILE_KEY = "buildmyoutfit_profile_v1";

const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const guestBtn = document.getElementById("guestBtn");
const authMsg = document.getElementById("authMsg");

function makeId(name){
return "p_"+name.toLowerCase().replace(/[^a-z0-9]/g,"_");
}

loginBtn.onclick = ()=>{
const name=usernameInput.value.trim();
if(!name){
authMsg.textContent="Enter username";
return;
}
localStorage.setItem(PROFILE_KEY,JSON.stringify({id:makeId(name),name}));
location.href="app.html";
};

guestBtn.onclick=()=>{
localStorage.setItem(PROFILE_KEY,JSON.stringify({id:"guest",name:"Guest"}));
location.href="app.html";
};
