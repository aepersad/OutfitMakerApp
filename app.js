const PROFILE_KEY = "buildmyoutfit_profile_v1";
const MAX_ITEMS = 10;

function itemsKey(profileId) {
  return `buildmyoutfit_items_${profileId}_v1`;
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadProfile() {
  return safeParse(localStorage.getItem(PROFILE_KEY), null);
}

const profile = loadProfile();
if (!profile) {
  location.href = "index.html";
}

/* ---------- DOM ---------- */
const profileLabel = document.getElementById("profileLabel");
const logoutBtn = document.getElementById("logoutBtn");
const closetCountEl = document.getElementById("closetCount");

const fileInput = document.getElementById("fileInput");
const fileNameEl = document.getElementById("fileName");
const imgPreview = document.getElementById("imgPreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const categorySelect = document.getElementById("categorySelect");
const topTypeGroup = document.getElementById("topTypeGroup");
const topTypeSelect = document.getElementById("topTypeSelect");
const bottomTypeGroup = document.getElementById("bottomTypeGroup");
const bottomTypeSelect = document.getElementById("bottomTypeSelect");
const sleeveGroup = document.getElementById("sleeveGroup");
const sleeveSelect = document.getElementById("sleeveSelect");
const dressLengthGroup = document.getElementById("dressLengthGroup");
const dressLengthSelect = document.getElementById("dressLengthSelect");
const colorSelect = document.getElementById("colorSelect");

const saveItemBtn = document.getElementById("saveItemBtn");
const clearClosetBtn = document.getElementById("clearClosetBtn");

const uploadMsg = document.getElementById("uploadMsg");
const closetGrid = document.getElementById("closetGrid");
const outfitsGrid = document.getElementById("outfitsGrid");
const selectedLabel = document.getElementById("selectedLabel");
const outfitMsg = document.getElementById("outfitMsg");

/* ---------- Header ---------- */
profileLabel.textContent = `Profile: ${profile.name || "Guest"}`;
logoutBtn.classList.add("logout-btn");

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(PROFILE_KEY);
  location.href = "index.html";
});

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
function setUploadMsg(text) {
  uploadMsg.textContent = text || "";
}

function setOutfitMsg(text) {
  outfitMsg.textContent = text || "";
}

function titleCase(value) {
  return (value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatItemLabel(item) {
  const parts = [];

  if (item.category === "top") {
    parts.push(`Top (${titleCase(item.topType)})`);
  } else if (item.category === "bottom") {
    parts.push(`Bottom (${titleCase(item.bottomType)})`);
  } else {
    parts.push(`Dress (${titleCase(item.dressLength)})`);
  }

  if (item.sleeveLength) parts.push(titleCase(item.sleeveLength));
  if (item.color) parts.push(titleCase(item.color));

  return parts.join(" • ");
}

function uuid() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

/* ---------- Conditional fields ---------- */
function updateConditionalFields() {
  const category = categorySelect.value;
  const isTop = category === "top";
  const isBottom = category === "bottom";
  const isDress = category === "dress";

  topTypeGroup.classList.toggle("hidden", !isTop);
  bottomTypeGroup.classList.toggle("hidden", !isBottom);
  sleeveGroup.classList.toggle("hidden", !(isTop || isDress));
  dressLengthGroup.classList.toggle("hidden", !isDress);

  if (!isTop) topTypeSelect.value = "";
  if (!isBottom) bottomTypeSelect.value = "";
  if (!(isTop || isDress)) sleeveSelect.value = "";
  if (!isDress) dressLengthSelect.value = "";
}

categorySelect.addEventListener("change", updateConditionalFields);

/* ---------- Image preview ---------- */
function resetPreview() {
  pendingImageDataUrl = "";
  imgPreview.src = "";
  imgPreview.style.display = "none";
  previewPlaceholder.style.display = "grid";
  fileInput.value = "";
  fileNameEl.textContent = "No file chosen";
}

fileInput.addEventListener("change", () => {
  setUploadMsg("");

  const file = fileInput.files && fileInput.files[0];
  fileNameEl.textContent = file ? file.name : "No file chosen";

  if (!file) {
    resetPreview();
    return;
  }

  if (!file.type.startsWith("image/")) {
    setUploadMsg("Please upload an image file.");
    resetPreview();
    return;
  }

  if (ITEMS.length >= MAX_ITEMS) {
    setUploadMsg(`Closet is full (${MAX_ITEMS} items max).`);
    resetPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingImageDataUrl = String(reader.result || "");
    imgPreview.src = pendingImageDataUrl;
    imgPreview.style.display = "block";
    previewPlaceholder.style.display = "none";
  };
  reader.readAsDataURL(file);
});

/* ---------- Form handling ---------- */
function normalizeItemFromForm() {
  const category = categorySelect.value;
  const color = colorSelect.value;
  const topType = topTypeSelect.value;
  const bottomType = bottomTypeSelect.value;
  const sleeveLength = sleeveSelect.value;
  const dressLength = dressLengthSelect.value;

  if (!pendingImageDataUrl) {
    return { error: "Choose an image first." };
  }

  if (!category) {
    return { error: "Select a category." };
  }

  if (!color) {
    return { error: "Select a color." };
  }

  if (category === "top") {
    if (!topType) {
      return { error: "Select a top type." };
    }

    if (!sleeveLength) {
      return { error: "Select a sleeve length." };
    }
  }

  if (category === "bottom") {
    if (!bottomType) {
      return { error: "Select a bottom type." };
    }
  }

  if (category === "dress") {
    if (!sleeveLength) {
      return { error: "Select a sleeve length." };
    }

    if (!dressLength) {
      return { error: "Select a dress length." };
    }
  }

  return {
    item: {
      id: uuid(),
      imageDataUrl: pendingImageDataUrl,
      category,
      topType: category === "top" ? topType : "",
      bottomType: category === "bottom" ? bottomType : "",
      sleeveLength: category === "top" || category === "dress" ? sleeveLength : "",
      dressLength: category === "dress" ? dressLength : "",
      color,
    },
  };
}

function resetForm() {
  resetPreview();
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
    setUploadMsg(`Closet is full (${MAX_ITEMS} items max).`);
    return;
  }

  const { item, error } = normalizeItemFromForm();

  if (error) {
    setUploadMsg(error);
    return;
  }

  ITEMS.push(item);
  saveItems();
  renderCloset();
  updateCounts();
  resetForm();
  setUploadMsg("Item saved to your closet.");
});

clearClosetBtn.addEventListener("click", () => {
  ITEMS = [];
  saveItems();
  renderCloset();
  clearOutfits();
  updateCounts();
  resetForm();
  setUploadMsg("Closet cleared.");
});

/* ---------- Matching rules ---------- */
function isLayer(item) {
  return (
    item.category === "top" &&
    (item.topType === "cardigan" ||
      item.topType === "sweater" ||
      item.topType === "jacket")
  );
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

function layerAllowedWithTop(top) {
  return top && top.category === "top" && top.sleeveLength === "short";
}

function layerAllowedWithDress(dress) {
  return (
    dress &&
    dress.category === "dress" &&
    (dress.sleeveLength === "sleeveless" || dress.sleeveLength === "short")
  );
}

const NEUTRALS = [
  "black",
  "white",
  "gray",
  "blue",
  "beige",
  "cream",
  "brown",
  "denim_blue",
];

function colorsCompatible(a, b) {
  if (!a || !b) return true;
  if (a === b) return true;
  if (NEUTRALS.includes(a) || NEUTRALS.includes(b)) return true;

  return true;
}

function outfitColorsOK(items) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (!colorsCompatible(items[i].color, items[j].color)) {
        return false;
      }
    }
  }
  return true;
}

function uniqOutfits(list) {
  const seen = new Set();
  const unique = [];

  for (const items of list) {
    const key = items
      .map((item) => item.id)
      .slice()
      .sort()
      .join("|");

    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(items);
  }

  return unique;
}

function generateOutfits(selected) {
  const shirts = ITEMS.filter(isShirt);
  const layers = ITEMS.filter(isLayer);
  const bottoms = ITEMS.filter(isBottom);
  const dresses = ITEMS.filter(isDress);

  const outfits = [];

  function add(items) {
    if (!items.some((item) => item.id === selected.id)) return;
    if (!outfitColorsOK(items)) return;
    outfits.push(items);
  }

  if (isLayer(selected)) {
    shirts.forEach((top) => {
      if (!layerAllowedWithTop(top)) return;

      bottoms.forEach((bottom) => {
        add([selected, top, bottom]);
      });
    });

    dresses.forEach((dress) => {
      if (!layerAllowedWithDress(dress)) return;
      add([selected, dress]);
    });

    return uniqOutfits(outfits);
  }

  if (isShirt(selected)) {
    bottoms.forEach((bottom) => {
      add([selected, bottom]);
    });

    if (layerAllowedWithTop(selected)) {
      layers.forEach((layer) => {
        bottoms.forEach((bottom) => {
          add([layer, selected, bottom]);
        });
      });
    }

    return uniqOutfits(outfits);
  }

  if (isDress(selected)) {
    add([selected]);

    if (layerAllowedWithDress(selected)) {
      layers.forEach((layer) => {
        add([layer, selected]);
      });
    }

    return uniqOutfits(outfits);
  }

  if (isBottom(selected)) {
    shirts.forEach((top) => {
      add([top, selected]);

      if (layerAllowedWithTop(top)) {
        layers.forEach((layer) => {
          add([layer, top, selected]);
        });
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

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderCloset() {
  closetGrid.innerHTML = "";

  if (!ITEMS.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Your closet is empty. Add a few pieces to get started.";
    closetGrid.appendChild(empty);
    updateCounts();
    return;
  }

  ITEMS.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    const img = document.createElement("img");
    img.src = item.imageDataUrl;
    img.alt = formatItemLabel(item);

    const body = document.createElement("div");
    body.className = "item-body";

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = formatItemLabel(item);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const useBtn = createButton("Use", "primary", () => {
      const outfits = generateOutfits(item);
      renderOutfits(item, outfits);
    });

    const delBtn = createButton("Delete", "danger", () => {
      ITEMS = ITEMS.filter((current) => current.id !== item.id);
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
    setOutfitMsg("No outfits found for this item yet.");
    return;
  }

  setOutfitMsg(`Found ${outfits.length} outfit${outfits.length === 1 ? "" : "s"}.`);

  outfits.forEach((items) => {
    const card = document.createElement("div");
    card.className = "outfit-card";

    const grid = document.createElement("div");
    grid.className = "outfit-items";

    if (items.length === 1) grid.classList.add("one");
    if (items.length === 3) grid.classList.add("three");

    items.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.imageDataUrl;
      img.alt = formatItemLabel(item);
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
clearOutfits();
