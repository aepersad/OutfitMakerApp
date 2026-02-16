const PROFILE_KEY = "buildmyoutfit_profile_v1";
const MAX_ITEMS = 10;

/* ---------- Require login ---------- */
const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
if (!profile) location.href = "index.html";

document.getElementById("profileLabel").textContent = "Profile: " + profile.name;

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem(PROFILE_KEY);
  location.href = "index.html";
};

/* ---------- State ---------- */
let ITEMS = [];
let pendingImage = "";

/* ---------- DOM ---------- */
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const imgPreview = document.getElementById("imgPreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const categorySelect = document.getElementById("categorySelect");
const topTypeSelect = document.getElementById("topTypeSelect");
const bottomTypeSelect = document.getElementById("bottomTypeSelect");
const sleeveSelect = document.getElementById("sleeveSelect");
const dressLengthSelect = document.getElementById("dressLengthSelect");
const colorSelect = document.getElementById("colorSelect");

const closetGrid = document.getElementById("closetGrid");
const outfitsGrid = document.getElementById("outfitsGrid");
const selectedLabel = document.getElementById("selectedLabel");

/* ---------- Upload preview ---------- */
fileInput.onchange = e => {

  const f = e.target.files[0];
  if (!f) return;

  fileName.textContent = f.name;

  const reader = new FileReader();

  reader.onload = () => {
    pendingImage = reader.result;
    imgPreview.src = pendingImage;
    imgPreview.style.display = "block";
    previewPlaceholder.style.display = "none";
  };

  reader.readAsDataURL(f);
};

/* ---------- Conditional dropdowns ---------- */
categorySelect.onchange = () => {

  const c = categorySelect.value;

  document.getElementById("topTypeRow").classList.toggle("hidden", c !== "top");
  document.getElementById("bottomTypeRow").classList.toggle("hidden", c !== "bottom");
  document.getElementById("sleeveRow").classList.toggle("hidden", c === "bottom");
  document.getElementById("dressLengthRow").classList.toggle("hidden", c !== "dress");

};

/* ---------- Save item ---------- */
document.getElementById("saveItemBtn").onclick = () => {

  if (!pendingImage) return;

  if (ITEMS.length >= MAX_ITEMS) {
    alert("Closet full (10 items max)");
    return;
  }

  const item = {
    id: Date.now().toString(),
    img: pendingImage,
    category: categorySelect.value,
    topType: topTypeSelect.value,
    bottomType: bottomTypeSelect.value,
    sleeve: sleeveSelect.value,
    dressLength: dressLengthSelect.value,
    color: colorSelect.value
  };

  ITEMS.push(item);

  resetUploader();
  renderCloset();

};

/* ---------- Clear closet ---------- */
document.getElementById("clearClosetBtn").onclick = () => {
  ITEMS = [];
  renderCloset();
  outfitsGrid.innerHTML = "";
  selectedLabel.textContent = "Select an item.";
};

/* ---------- Reset uploader ---------- */
function resetUploader(){

  pendingImage = "";
  fileInput.value = "";
  fileName.textContent = "No file chosen";

  imgPreview.src = "";
  imgPreview.style.display = "none";
  previewPlaceholder.style.display = "grid";

  categorySelect.value = "";
  topTypeSelect.value = "";
  bottomTypeSelect.value = "";
  sleeveSelect.value = "";
  dressLengthSelect.value = "";
  colorSelect.value = "";

}

/* ---------- Helper checks ---------- */

function isLayer(item){
  return item.category==="top" &&
  (item.topType==="cardigan" || item.topType==="sweater" || item.topType==="jacket");
}

function isShirt(item){
  return item.category==="top" && item.topType==="shirt";
}

function isBottom(item){
  return item.category==="bottom";
}

function isDress(item){
  return item.category==="dress";
}

/* ---------- Outfit generator ---------- */

function generateOutfits(selected){

  const outfits = [];

  const shirts = ITEMS.filter(isShirt);
  const layers = ITEMS.filter(isLayer);
  const bottoms = ITEMS.filter(isBottom);
  const dresses = ITEMS.filter(isDress);

  /* LAYER SELECTED */
  if(isLayer(selected)){

    shirts.forEach(top=>{
      if(top.sleeve==="short"){
        bottoms.forEach(bottom=>{
          outfits.push([selected,top,bottom]);
        });
      }
    });

    dresses.forEach(d=>{
      if(d.sleeve==="short" || d.sleeve==="sleeveless"){
        outfits.push([selected,d]);
      }
    });

    return outfits;
  }

  /* SHIRT SELECTED */
  if(isShirt(selected)){

    bottoms.forEach(b=>{
      outfits.push([selected,b]);
    });

    if(selected.sleeve==="short"){
      layers.forEach(layer=>{
        bottoms.forEach(b=>{
          outfits.push([layer,selected,b]);
        });
      });
    }

    return outfits;
  }

  /* DRESS SELECTED */
  if(isDress(selected)){

    outfits.push([selected]);

    if(selected.sleeve==="short" || selected.sleeve==="sleeveless"){
      layers.forEach(layer=>{
        outfits.push([layer,selected]);
      });
    }

    return outfits;
  }

  /* BOTTOM SELECTED */
  if(isBottom(selected)){

    shirts.forEach(top=>{
      outfits.push([top,selected]);

      if(top.sleeve==="short"){
        layers.forEach(layer=>{
          outfits.push([layer,top,selected]);
        });
      }
    });

    return outfits;
  }

  return outfits;
}

/* ---------- Render closet ---------- */

function renderCloset(){

  closetGrid.innerHTML="";

  ITEMS.forEach(it=>{

    const d=document.createElement("div");
    d.className="item-card";

    d.innerHTML=`
<img src="${it.img}">
<div class="item-body">
<div>${it.category} • ${it.color}</div>
<div class="actions">
<button class="use primary">Use</button>
<button class="del danger">Delete</button>
</div>
</div>
`;

    d.querySelector(".del").onclick=()=>{
      ITEMS=ITEMS.filter(x=>x.id!==it.id);
      renderCloset();
      outfitsGrid.innerHTML="";
      selectedLabel.textContent="Select an item.";
    };

    d.querySelector(".use").onclick=()=>{
      selectedLabel.textContent="Selected: "+it.category;
      renderOutfits(generateOutfits(it));
    };

    closetGrid.appendChild(d);

  });

}

/* ---------- Render outfits ---------- */

function renderOutfits(list){

  outfitsGrid.innerHTML="";

  if(!list.length){
    outfitsGrid.innerHTML="<div class='card'>No matches</div>";
    return;
  }

  list.forEach(outfit=>{

    const card=document.createElement("div");
    card.className="card";

    const imgs=outfit.map(i=>`<img src="${i.img}" style="width:100%;height:160px;object-fit:cover;">`).join("");

    card.innerHTML=imgs;

    outfitsGrid.appendChild(card);

  });

}
