const PROFILE_KEY="buildmyoutfit_profile_v1";

const usernameInput=document.getElementById("usernameInput");
const loginBtn=document.getElementById("loginBtn");
const guestBtn=document.getElementById("guestBtn");

function makeId(n){
return "p_"+n.toLowerCase().replace(/[^a-z0-9]/g,"_");
}

loginBtn.onclick=()=>{
const name=usernameInput.value.trim();
if(!name) return;
localStorage.setItem(PROFILE_KEY,JSON.stringify({id:makeId(name),name}));
location.href="app.html";
};

guestBtn.onclick=()=>{
localStorage.setItem(PROFILE_KEY,JSON.stringify({id:"guest",name:"Guest"}));
location.href="app.html";
};
