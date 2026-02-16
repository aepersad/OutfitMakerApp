const MAX_ITEMS = 10;

const PROFILE_KEY = "buildmyoutfit_profile_v1";
function itemsKey(profileId) { return `buildmyoutfit_items_${profileId}_v1`; }
function favsKey(profileId)  { return `buildmyoutfit_favs_${profileId}_v1`; }

/* ---------- Color Logic (EDIT THIS) ---------- */
const NEUTRALS = ["black","white","gray","navy","beige","cream","brown","denim_blue"];
const COLOR_CLASHES = {
  red: ["green", "orange", "purple"],
  green: ["red", "pink", "orange"],
  orange: ["pink", "red", "purple"],
  pink: ["orange", "green"],
  yellow: ["purple", "orange"],
  purple: ["yellow", "orange", "red"],
  black: [], white: [], gray: [], navy: [], beige: [], cream: [], brown: [], denim_blue: []
};

function safeParse(raw, fallback) { try { return JSON.parse(raw); } catch { return fallback; } }

function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  const p = raw ? safeParse(raw, null) : null;
  return (p && p.id) ? p : null;
}

function loadItems(profileId) {
  const raw = localStorage.getItem(itemsKey(profileId));
  const parsed = raw ? safeParse(raw, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}
function saveItems(profileId, items) {
  localStorage.setItem(itemsKey(profileId), JSON.stringify(items));
}

function loadFavs(profileId) {
  const raw = localStorage.getItem(favsKey(profileId));
  const parsed = raw ? safeParse(raw, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}
function saveFavs(profileId, favs) {
  localStorage.setItem(favsKey(profileId), JSON.stringify(favs));
}

/* ---------- Require profile ---------- */
const profile = loadProfile();
if (!profile) window.location.replace("index.html");

/* ---------- State ---------- */
let ITEMS = loadItems(profile.id);
let FAVS = loadFavs(profile.id);
let pendingImageDataUrl = "";

/* ---------- DOM ---------- */
const maxCountEl = document.getElementById("maxCount");
const closetCountEl = document.getElementById("closetCount");
const profileLabel = document.getElementById("profileLabel");
const logoutBtn = document.getElementById("logoutBtn");

const fileInput = document.getElementById("fileInput");
const imgPreview = document.getElementById("imgPreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const categorySelect = document.getElementById("categorySelect");
const topTypeLabel = document.getElementById("topTypeLabel");
const topTypeSelect = document.getElementById("topTypeSelect");
const bottomTypeLabel = document.getElementById("bottomTypeLabel");
const bottomTypeSelect = document.getElementById("bottomTypeSelect");
const sleeveLabel = document.getElementById("sleeveLabel");
const sleeveSelect = document.getElementById("sleeveSelect");
const dressLengthLabel = document.getElementById("dressLengthLabel");
const dressLengthSelect = document.getElementById("dressLengthSelect");
const colorSelect = document.getElementById("colorSelect");

const saveItemBtn = document.getElementById("saveItemBtn");
const clearClosetBtn = document.getElementById("clearClosetBtn");
const uploadMsg = document.getElementById("uploadMsg");

const closetGrid = document.getElementById("closetGrid");

const outfitsGrid = document.getElementById("outfitsGrid");
const outfitMsg = document.getElementById("outfitMsg");
const selectedLabel = document.getElementById("selectedLabel");

const favoritesGrid = document.getElementById("favoritesGrid");
const favoritesMsg = document.getElementById("favoritesMsg");

maxCountEl.textContent = String(MAX_ITEMS);
profileLabel.textContent = `Profile: ${profile?.name || "Guest"}`;

function setUploadMsg(t) { uploadMsg.textContent = t || ""; }
function setOutfitMsg(t) { outfitMsg.textContent = t || ""; }
function setFavMsg(t) { favoritesMsg.textContent = t || ""; }

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(PROFILE_KEY);
  window.location.href = "index.html";
});

/* ---------- Color matching ---------- */
function colorsMatch(a, b) {
  if (!a || !b) return true;
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return true;
  if (NEUTRALS.includes(a) || NEUTRALS.includes(b)) return true;
  if (COLOR_CLASHES[a]?.includes(b)) return false;
  if (COLOR_CLASHES[b]?.includes(a)) return false;
  return true;
}
function outfitColorsOK(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!colorsMatch(items[i].color, items[j].color)) return false;
    }
  }
  return true;
}

/* ---------- Conditional fields ---------- */
function updateConditionalFields() {
  const cat = categorySelect.value;

  const showTopType = cat === "top";
  const showBottomType = cat === "bottom";
  const showSleeve = cat === "top" || cat === "dress";
  const showDressLength = cat === "dress";

  topTypeLabel.classList.toggle("hidden", !showTopType);
  bottomTypeLabel.classList.toggle("hidden", !showBottomType);
  sleeveLabel.classList.toggle("hidden", !showSleeve);
  dressLengthLabel.classList.toggle("hidden", !showDressLength);

  if (!showTopType) topTypeSelect.value = "";
  if (!showBottomType) bottomTypeSelect.value = "";
  if (!showSleeve) sleeveSelect.value = "";
  if (!showDressLength) dressLengthSelect.value = "";
}
categorySelect.addEventListener("change", updateConditionalFields);

/* ---------- Upload handling ---------- */
fileInput.addEventListener("change", () => {
  setUploadMsg("");
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;

  if (!f.type.startsWith("image/")) {
    setUploadMsg("Upload an image file.");
    fileInput.value = "";
    return;
  }
  if (ITEMS.length >= MAX_ITEMS) {
    setUploadMsg(`Closet is full (${MAX_ITEMS}).`);
    fileInput.value = "";
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

function normalizeItemFromForm() {
  const category = categorySelect.value;
  const color = colorSelect.value;
  const sleeveLength = sleeveSelect.value;
  const topType = topTypeSelect.value;
  const bottomType = bottomTypeSelect.value;
  const dressLength = dressLengthSelect.value;

  if (!pendingImageDataUrl) return { error: "Upload a photo." };
  if (!category) return { error: "Select a category." };
  if (!color) return { error: "Select a color." };

  if ((category === "top" || category === "dress") && !sleeveLength) {
    return { error: "Select sleeve length." };
  }
  if (category === "top" && !topType) return { error: "Select top type." };
  if (category === "bottom" && !bottomType) return { error: "Select bottom type." };
  if (category === "dress" && !dressLength) return { error: "Select dress length." };

  const id =
    (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
    `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

  return {
    item: {
      id,
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
  previewPlaceholder.style.display = "block";
  fileInput.value = "";

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
  saveItems(profile.id, ITEMS);

  renderCloset();
  resetUploader();
  setUploadMsg(`Saved (${ITEMS.length}/${MAX_ITEMS}).`);
});

clearClosetBtn.addEventListener("click", () => {
  ITEMS = [];
  saveItems(profile.id, ITEMS);

  FAVS = [];
  saveFavs(profile.id, FAVS);

  renderCloset();
  renderFavorites();
  clearGeneratedOutfits();
  setUploadMsg("Cleared.");
});

/* ---------- Type helpers ---------- */
function isDress(item) { return item.category === "dress"; }
function isBottom(item) { return item.category === "bottom"; }
function isLayer(item) {
  return item.category === "top" && (item.topType === "cardigan" || item.topType === "sweater" || item.topType === "jacket");
}
function isShirt(item) { return item.category === "top" && item.topType === "shirt"; }

function canWearLayerWithTop(top, layer) {
  if (!layer || !isLayer(layer)) return true;
  if (!top || top.category !== "top") return false;
  return top.sleeveLength === "short";
}
function canWearLayerWithDress(dress, layer) {
  if (!layer || !isLayer(layer)) return true;
  if (!dress || !isDress(dress)) return false;
  return dress.sleeveLength === "sleeveless" || dress.sleeveLength === "short";
}

/* ---------- Rendering ---------- */
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

function renderCloset() {
  closetGrid.innerHTML = "";
  closetCountEl.textContent = `${ITEMS.length}/${MAX_ITEMS}`;

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

    const btnRow = document.createElement("div");
    btnRow.className = "item-actions";

    const useBtn = document.createElement("button");
    useBtn.className = "primary";
    useBtn.textContent = "Use";
    useBtn.addEventListener("click", () => generateAndRenderOutfits(it));

    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      ITEMS = ITEMS.filter(x => x.id !== it.id);
      saveItems(profile.id, ITEMS);

      pruneFavorites();
      saveFavs(profile.id, FAVS);

      renderCloset();
      renderFavorites();
    });

    btnRow.appendChild(useBtn);
    btnRow.appendChild(delBtn);

    body.appendChild(meta);
    body.appendChild(btnRow);

    card.appendChild(img);
    card.appendChild(body);

    closetGrid.appendChild(card);
  });
}

function clearGeneratedOutfits() {
  outfitsGrid.innerHTML = "";
  selectedLabel.textContent = "Select an item.";
  setOutfitMsg("");
}

/* ---------- Favorites ---------- */
function outfitIdFromItems(items) {
  return items.map(x => x.id).slice().sort().join("|");
}
function isFavorited(outfitId) {
  return FAVS.some(f => f.outfitId === outfitId);
}
function toggleFavorite(items) {
  const outfitId = outfitIdFromItems(items);
  if (isFavorited(outfitId)) FAVS = FAVS.filter(f => f.outfitId !== outfitId);
  else FAVS.push({ outfitId, itemIds: items.map(x => x.id), createdAt: Date.now() });

  saveFavs(profile.id, FAVS);
  renderFavorites();
}
function pruneFavorites() {
  const existing = new Set(ITEMS.map(i => i.id));
  FAVS = FAVS.filter(f => f.itemIds.every(id => existing.has(id)));
}
function resolveFavOutfit(fav) {
  const map = new Map(ITEMS.map(i => [i.id, i]));
  const items = fav.itemIds.map(id => map.get(id)).filter(Boolean);
  return (items.length === fav.itemIds.length) ? items : null;
}

function renderFavorites() {
  favoritesGrid.innerHTML = "";
  setFavMsg("");

  pruneFavorites();
  saveFavs(profile.id, FAVS);

  if (!FAVS.length) return;

  const ordered = [...FAVS].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  ordered.forEach((fav) => {
    const items = resolveFavOutfit(fav);
    if (!items) return;

    const card = document.createElement("div");
    card.className = "outfit-card";

    const grid = document.createElement("div");
    grid.className = "outfit-items";
    if (items.length === 1) grid.classList.add("one");
    if (items.length === 2) grid.classList.add("two");

    items.forEach((it) => {
      const img = document.createElement("img");
      img.src = it.imageDataUrl;
      img.alt = formatItemLabel(it);
      grid.appendChild(img);
    });

    const meta = document.createElement("div");
    meta.className = "outfit-meta";

    const left = document.createElement("div");
    left.textContent = items.map(formatItemLabel).join(" | ");

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "fav-btn on";
    removeBtn.textContent = "♥ Remove";
    removeBtn.addEventListener("click", () => {
      FAVS = FAVS.filter(f => f.outfitId !== fav.outfitId);
      saveFavs(profile.id, FAVS);
      renderFavorites();
    });

    meta.appendChild(left);
    meta.appendChild(removeBtn);

    card.appendChild(grid);
    card.appendChild(meta);
    favoritesGrid.appendChild(card);
  });
}

/* ---------- Outfits ---------- */
function renderOutfits(selected, outfits) {
  outfitsGrid.innerHTML = "";
  setOutfitMsg("");
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
    if (items.length === 2) grid.classList.add("two");

    items.forEach((it) => {
      const img = document.createElement("img");
      img.src = it.imageDataUrl;
      img.alt = formatItemLabel(it);
      grid.appendChild(img);
    });

    const meta = document.createElement("div");
    meta.className = "outfit-meta";

    const left = document.createElement("div");
    left.textContent = items.map(formatItemLabel).join(" | ");

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "fav-btn";

    const oid = outfitIdFromItems(items);
    const on = isFavorited(oid);
    favBtn.classList.toggle("on", on);
    favBtn.textContent = on ? "♥ Favorited" : "♡ Favorite";

    favBtn.addEventListener("click", () => {
      toggleFavorite(items);
      const nowOn = isFavorited(oid);
      favBtn.classList.toggle("on", nowOn);
      favBtn.textContent = nowOn ? "♥ Favorited" : "♡ Favorite";
    });

    meta.appendChild(left);
    meta.appendChild(favBtn);

    card.appendChild(grid);
    card.appendChild(meta);
    outfitsGrid.appendChild(card);
  });
}

function uniqOutfits(outfits) {
  const seen = new Set();
  const out = [];
  for (const items of outfits) {
    const key = outfitIdFromItems(items);
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

  function maybeAdd(items) {
    if (!items.some(x => x.id === selected.id)) return;
    if (!outfitColorsOK(items)) return;
    outfits.push(items);
  }

  if (isLayer(selected)) {
    shirts.filter(t => t.sleeveLength === "short").forEach((top) => {
      bottoms.forEach((bottom) => maybeAdd([selected, top, bottom]));
    });
    dresses.filter(d => d.sleeveLength === "sleeveless" || d.sleeveLength === "short")
      .forEach((dress) => maybeAdd([selected, dress]));
    return uniqOutfits(outfits);
  }

  if (isShirt(selected)) {
    bottoms.forEach((bottom) => maybeAdd([selected, bottom]));
    if (selected.sleeveLength === "short") {
      layers.forEach((layer) => {
        bottoms.forEach((bottom) => {
          if (!canWearLayerWithTop(selected, layer)) return;
          maybeAdd([layer, selected, bottom]);
        });
      });
    }
    return uniqOutfits(outfits);
  }

  if (isDress(selected)) {
    maybeAdd([selected]);
    if (selected.sleeveLength === "sleeveless" || selected.sleeveLength === "short") {
      layers.forEach((layer) => {
        if (!canWearLayerWithDress(selected, layer)) return;
        maybeAdd([layer, selected]);
      });
    }
    return uniqOutfits(outfits);
  }

  if (isBottom(selected)) {
    shirts.forEach((top) => {
      maybeAdd([top, selected]);
      if (top.sleeveLength === "short") {
        layers.forEach((layer) => {
          if (!canWearLayerWithTop(top, layer)) return;
          maybeAdd([layer, top, selected]);
        });
      }
    });
    return uniqOutfits(outfits);
  }

  return uniqOutfits(outfits);
}

function generateAndRenderOutfits(selected) {
  renderOutfits(selected, generateOutfits(selected));
}

/* ---------- Init ---------- */
function init() {
  updateConditionalFields();
  renderCloset();
  renderFavorites();
  setUploadMsg(`Closet: ${ITEMS.length}/${MAX_ITEMS}`);
}
init();
