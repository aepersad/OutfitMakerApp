const PROFILE_KEY = "buildmyoutfit_profile_v1";
const MAX_ITEMS = 10;

function itemsKey(profileId) {
  return `buildmyoutfit_items_${profileId}_v1`;
}

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function loadProfile() {
  return safeParse(localStorage.getItem(PROFILE_KEY), null);
}

const profile = loadProfile();
if (!profile) location.href = "index.html";

/* ---------- DOM ---------- */
const profileLabel = document.getElementById("profileLabel");
const logoutBtn = document.getElementById("logoutBtn");

const closetCountEl = document.getElementById("closetCount");
const maxCountEl = document.getElementById("maxCount");

const fileInput = document.getElementById("fileInput");
const fileNameEl = document.getElementById("fileName");
const imgPreview = document.getElementById("imgPreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const categorySelect = document.getElementById("categorySelect");
const topTypeRow = document.getElementById("topTypeRow");
const topTypeSelect = document.getElementById("topTypeSelect");
const bottomTypeRow = document.getElementById("bottomTypeRow");
const bottomTypeSelect = document.getElementById("bottomTypeSelect");
const sleeveRow = document.getElementById("sleeveRow");
const sleeveSelect = document.getElementById("sleeveSelect");
const dressLengthRow = document.getElementById("dressLengthRow");
const dressLengthSelect = document.getElementById("dressLengthSelect");
const colorSelect = document.getElementById("colorSelect");

const saveItemBtn = document.getElementById("saveItemBtn");
const clearClosetBtn = document.getElementById("clearClosetBtn");
const uploadMsg = document.getElementById("uploadMsg");

const closetGrid = document.getElementById("closetGrid");

const outfitsGrid = document.getElementById("outfitsGrid");
const selectedLabel = document.getElementById("selectedLabel");
const outfitMsg = document.getElementById("outfitMsg");

/* ---------- UI header ---------- */
profileLabel.textContent = `Profile: ${profile.name || "Guest"}`;
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(PROFILE_KEY);
  location.href = "index.html";
});

maxCountEl.textContent = String(MAX_ITEMS);

/* ---------- State ---------- */
let ITEMS = loadItems();
let pendingImageDataUrl = "";

/* ---------- Storage ---------- */
function loadItems() {
  const raw = localStorage.getItem(itemsKey(profile.id));
  const parsed = raw ? safeParse(raw, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}

function saveItems() {
  localStorage.setItem(itemsKey(profile.id), JSON.stringify(ITEMS));
}

/* ---------- Helpers ---------- */
function setUploadMsg(t) { uploadMsg.textContent = t || ""; }
function setOutfitMsg(t) { outfitMsg.textContent = t || ""; }

function titleCase(s) {
  return (s || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatItemLabel(it) {
  const parts = [];
  if (it.category === "top") parts.push(`Top (${titleCase(it.topType)})`);
  else if (it.category === "bottom") parts.push(`Bottom (${titleCase(it.bottomType)})`);
  else parts.push(`Dress (${titleCase(it.dressLength)})`);
  if (it.sleeveLength) parts.push(titleCase(it.sleeveLength));
  if (it.color) parts.push(titleCase(it.color));
  return parts.join(" • ");
}

function uuid() {
  return (crypto?.randomUUID?.()) || `id_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
}

/* ---------- Conditional fields (show/hide) ---------- */
function updateConditionalFields() {
  const c = categorySelect.value;

  const showTop = c === "top";
  const showBottom = c === "bottom";
  const showSleeve = (c === "top" || c === "dress");
  const showDressLen = c === "dress";

  topTypeRow.classList.toggle("hidden", !showTop);
  topTypeSelect.classList.toggle("hidden", !showTop);

  bottomTypeRow.classList.toggle("hidden", !showBottom);
  bottomTypeSelect.classList.toggle("hidden", !showBottom);

  sleeveRow.classList.toggle("hidden", !showSleeve);
  sleeveSelect.classList.toggle("hidden", !showSleeve);

  dressLengthRow.classList.toggle("hidden", !showDressLen);
  dressLengthSelect.classList.toggle("hidden", !showDressLen);

  if (!showTop) topTypeSelect.value = "";
  if (!showBottom) bottomTypeSelect.value = "";
  if (!showSleeve) sleeveSelect.value = "";
  if (!showDressLen) dressLengthSelect.value = "";
}

categorySelect.addEventListener("change", updateConditionalFields);

/* ---------- Upload preview ---------- */
fileInput.addEventListener("change", () => {
  setUploadMsg("");
  const f = fileInput.files && fileInput.files[0];
  fileNameEl.textContent = f ? f.name : "No file chosen";
  if (!f) return;

  if (!f.type.startsWith("image/")) {
    setUploadMsg("Upload an image file.");
    fileInput.value = "";
    fileNameEl.textContent = "No file chosen";
    return;
  }

  if (ITEMS.length >= MAX_ITEMS) {
    setUploadMsg(`Closet is full (${MAX_ITEMS}).`);
    fileInput.value = "";
    fileNameEl.textContent = "No file chosen";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingImageDataUrl = String(reader.result || "");
    imgPreview.src = pendingImageDataUrl;
    imgPreview.style.display = "block";
    previewPlaceholder.style.display = "none";
  };
  reader.readAsDataURL(f);
});

/* ---------- Save item ---------- */
function normalizeItemFromForm() {
  const category = categorySelect.value;
  const color = colorSelect.value;

  const topType = topTypeSelect.value;
  const bottomType = bottomTypeSelect.value;
  const sleeveLength = sleeveSelect.value;
  const dressLength = dressLengthSelect.value;

  if (!pendingImageDataUrl) return { error: "Choose a file." };
  if (!category) return { error: "Select a category." };
  if (!color) return { error: "Select a color." };

  if (category === "top") {
    if (!topType) return { error: "Select a subcategory." };
    if (!sleeveLength) return { error: "Select sleeve length." };
  }

  if (category === "bottom") {
    if (!bottomType) return { error: "Select a subcategory." };
  }

  if (category === "dress") {
    if (!sleeveLength) return { error: "Select sleeve length." };
    if (!dressLength) return { error: "Select dress length." };
  }

  return {
    item: {
      id: uuid(),
      imageDataUrl: pendingImageDataUrl,
      category,
      topType: category === "top" ? topType : "",
      bottomType: category === "bottom" ? bottomType : "",
      sleeveLength: (category === "top" || category === "dress") ? sleeveLength : "",
      dressLength: category === "dress" ? dressLength : "",
      color
    }
  };
}

function resetUploader() {
  pendingImageDataUrl = "";
  imgPreview.src = "";
  imgPreview.style.display = "none";
  previewPlaceholder.style.display = "grid";

  fileInput.value = "";
  fileNameEl.textContent = "No file chosen";

  categorySelect.value = "";
  topTypeSelect.value = "";
  bottomTypeSelect.value = "";
  sleeveSelect.value = "";
  dressLengthSelect.value = "";
  colorSelect.value = "";

  updateConditionalFields();
}

saveItemBtn.addEventListener("click", () => {
  setUploadMsg("");

  if (ITEMS.length >= MAX_ITEMS) {
    setUploadMsg(`Closet is full (${MAX_ITEMS}).`);
    return;
  }

  const { item, error } = normalizeItemFromForm();
  if (error) { setUploadMsg(error); return; }

  ITEMS.push(item);
  saveItems();
  renderCloset();
  resetUploader();
  updateCounts();
});

clearClosetBtn.addEventListener("click", () => {
  ITEMS = [];
  saveItems();
  renderCloset();
  clearOutfits();
  updateCounts();
  setUploadMsg("");
});

/* ---------- Matching rules ---------- */
// Layer items: cardigan / sweater / jacket
function isLayer(item) {
  return item.category === "top" &&
    (item.topType === "cardigan" || item.topType === "sweater" || item.topType === "jacket");
}
function isShirt(item) {
  return item.category === "top" && item.topType === "shirt";
}
function isBottom(item) {
  return item.category === "bottom";
}
function isDress(item) {
  return item.category === "dress";
}

// Layer can only be worn with short sleeve top OR sleeveless/short sleeve dress
function layerAllowedWithTop(top) {
  return top && top.category === "top" && top.sleeveLength === "short";
}
function layerAllowedWithDress(dress) {
  return dress && dress.category === "dress" &&
    (dress.sleeveLength === "sleeveless" || dress.sleeveLength === "short");
}

// Color pairing hook (simple neutral-safe by default; you can replace this)
const NEUTRALS = ["black","white","gray","navy","beige","cream","brown","denim_blue"];
function colorsCompatible(a, b) {
  if (!a || !b) return true;
  if (a === b) return true;
  if (NEUTRALS.includes(a) || NEUTRALS.includes(b)) return true;
  return true; // keep permissive; you can tighten later
}
function outfitColorsOK(items) {
  for (let i=0;i<items.length;i++){
    for (let j=i+1;j<items.length;j++){
      if (!colorsCompatible(items[i].color, items[j].color)) return false;
    }
  }
  return true;
}

function uniqOutfits(outfits) {
  const seen = new Set();
  const out = [];
  for (const items of outfits) {
    const key = items.map(x => x.id).slice().sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(items);
  }
  return out;
}

function generateOutfits(selected) {
  const shirts = ITEMS.filter(isShirt);
  const layers = ITEMS.filter(isLayer);
  const bottoms = ITEMS.filter(isBottom);
  const dresses = ITEMS.filter(isDress);

  const outfits = [];

  function add(items) {
    // must include selected
    if (!items.some(x => x.id === selected.id)) return;
    if (!outfitColorsOK(items)) return;
    outfits.push(items);
  }

  // If selected is a layer
  if (isLayer(selected)) {
    shirts.forEach(top => {
      if (!layerAllowedWithTop(top)) return;
      bottoms.forEach(bottom => add([selected, top, bottom]));
    });

    dresses.forEach(dress => {
      if (!layerAllowedWithDress(dress)) return;
      add([selected, dress]);
    });

    return uniqOutfits(outfits);
  }

  // If selected is a shirt
  if (isShirt(selected)) {
    bottoms.forEach(bottom => add([selected, bottom]));
    if (layerAllowedWithTop(selected)) {
      layers.forEach(layer => {
        bottoms.forEach(bottom => add([layer, selected, bottom]));
      });
    }
    return uniqOutfits(outfits);
  }

  // If selected is a dress
  if (isDress(selected)) {
    add([selected]);
    if (layerAllowedWithDress(selected)) {
      layers.forEach(layer => add([layer, selected]));
    }
    return uniqOutfits(outfits);
  }

  // If selected is a bottom
  if (isBottom(selected)) {
    shirts.forEach(top => {
      add([top, selected]);
      if (layerAllowedWithTop(top)) {
        layers.forEach(layer => add([layer, top, selected]));
      }
    });
    return uniqOutfits(outfits);
  }

  return uniqOutfits(outfits);
}

/* ---------- Rendering ---------- */
function updateCounts() {
  closetCountEl.textContent = `${ITEMS.length}/${MAX_ITEMS}`;
}

function clearOutfits() {
  outfitsGrid.innerHTML = "";
  selectedLabel.textContent = "Select an item.";
  setOutfitMsg("");
}

function renderCloset() {
  closetGrid.innerHTML = "";

  ITEMS.forEach((it) => {
    const card = document.createElement("div");
    card.className = "item-card";

    const img = document.createElement("img");
    img.src = it.imageDataUrl;
    img.alt = formatItemLabel(it);

    const body = document.createElement("div");
    body.className = "item-body";

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = formatItemLabel(it);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const useBtn = document.createElement("button");
    useBtn.className = "primary";
    useBtn.textContent = "Use";
    useBtn.addEventListener("click", () => {
      const outfits = generateOutfits(it);
      renderOutfits(it, outfits);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      ITEMS = ITEMS.filter(x => x.id !== it.id);
      saveItems();
      renderCloset();
      clearOutfits();
      updateCounts();
    });

    actions.appendChild(useBtn);
    actions.appendChild(delBtn);

    body.appendChild(meta);
    body.appendChild(actions);

    card.appendChild(img);
    card.appendChild(body);

    closetGrid.appendChild(card);
  });

  updateCounts();
}

function renderOutfits(selected, outfits) {
  outfitsGrid.innerHTML = "";
  selectedLabel.textContent = `Selected: ${formatItemLabel(selected)}`;

  if (!outfits.length) {
    setOutfitMsg("No outfits found.");
    return;
  }

  setOutfitMsg(`Found ${outfits.length}.`);

  outfits.forEach((items) => {
    const card = document.createElement("div");
    card.className = "outfit-card";

    const grid = document.createElement("div");
    grid.className = "outfit-items";
    if (items.length === 1) grid.classList.add("one");
    if (items.length === 3) grid.classList.add("three");

    items.forEach((it) => {
      const img = document.createElement("img");
      img.src = it.imageDataUrl;
      img.alt = formatItemLabel(it);
      grid.appendChild(img);
    });

    const meta = document.createElement("div");
    meta.className = "outfit-meta";
    meta.textContent = items.map(formatItemLabel).join(" | ");

    card.appendChild(grid);
    card.appendChild(meta);

    outfitsGrid.appendChild(card);
  });
}

/* ---------- Init ---------- */
updateConditionalFields();
renderCloset();
updateCounts();
