const PROFILE_KEY    = "buildmyoutfit_profile_v1";
const MAX_ITEMS      = 10;
const OCCASIONS_LIST = ["All", "Casual", "Work", "Formal", "Date Night", "Sport", "Weekend"];
const DAY_NAMES      = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/* ---------- Keys ---------- */
function itemsKey(id)      { return `buildmyoutfit_items_${id}_v1`; }
function outfitDataKey(id) { return `buildmyoutfit_outfitdata_${id}_v1`; }
function calendarKey(id)   { return `buildmyoutfit_calendar_${id}_v1`; }

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

/* ---------- Auth guard ---------- */
const profile = safeParse(localStorage.getItem(PROFILE_KEY), null);
if (!profile) location.href = "index.html";

/* ---------- DOM ---------- */
const profileLabel        = document.getElementById("profileLabel");
const logoutBtn           = document.getElementById("logoutBtn");
const closetCountEl       = document.getElementById("closetCount");
const fileInput           = document.getElementById("fileInput");
const fileNameEl          = document.getElementById("fileName");
const imgPreview          = document.getElementById("imgPreview");
const previewPlaceholder  = document.getElementById("previewPlaceholder");
const categorySelect      = document.getElementById("categorySelect");
const topTypeGroup        = document.getElementById("topTypeGroup");
const topTypeSelect       = document.getElementById("topTypeSelect");
const bottomTypeGroup     = document.getElementById("bottomTypeGroup");
const bottomTypeSelect    = document.getElementById("bottomTypeSelect");
const sleeveGroup         = document.getElementById("sleeveGroup");
const sleeveSelect        = document.getElementById("sleeveSelect");
const dressLengthGroup    = document.getElementById("dressLengthGroup");
const dressLengthSelect   = document.getElementById("dressLengthSelect");
const shoeTypeGroup       = document.getElementById("shoeTypeGroup");
const shoeTypeSelect      = document.getElementById("shoeTypeSelect");
const outerwearTypeGroup  = document.getElementById("outerwearTypeGroup");
const outerwearTypeSelect = document.getElementById("outerwearTypeSelect");
const colorSelect         = document.getElementById("colorSelect");
const occasionSelect      = document.getElementById("occasionSelect");
const saveItemBtn         = document.getElementById("saveItemBtn");
const clearClosetBtn      = document.getElementById("clearClosetBtn");
const uploadMsg           = document.getElementById("uploadMsg");
const closetGrid          = document.getElementById("closetGrid");
const closetSearch        = document.getElementById("closetSearch");
const closetFilterCat     = document.getElementById("closetFilterCategory");
const closetFilterOcc     = document.getElementById("closetFilterOccasion");
const outfitsGrid         = document.getElementById("outfitsGrid");
const selectedLabel       = document.getElementById("selectedLabel");
const outfitMsg           = document.getElementById("outfitMsg");
const occasionFilterBar   = document.getElementById("occasionFilterBar");
const surpriseMeBtn       = document.getElementById("surpriseMeBtn");
const calendarGrid        = document.getElementById("calendarGrid");
const calendarMsg         = document.getElementById("calendarMsg");
const styleProfileMsg     = document.getElementById("styleProfileMsg");
const styleProfileBars    = document.getElementById("styleProfileBars");

/* ---------- Header ---------- */
profileLabel.textContent = `Profile: ${profile.name || "Guest"}`;
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(PROFILE_KEY);
  location.href = "index.html";
});

/* ---------- State ---------- */
let ITEMS                = loadItems();
let OUTFIT_DATA          = loadOutfitData();
let CALENDAR_DATA        = loadCalendarData();
let pendingImageDataUrl  = "";
let activeOccasionFilter = "All";
let lastRenderedOutfits  = [];
let lastSelectedItem     = null;
let closetSearchText     = "";
let closetCatFilter      = "";
let closetOccFilter      = "";

/* ---------- Storage ---------- */
function loadItems() {
  const p = safeParse(localStorage.getItem(itemsKey(profile.id)), []);
  return Array.isArray(p) ? p : [];
}
function saveItems()        { localStorage.setItem(itemsKey(profile.id),      JSON.stringify(ITEMS)); }
function loadOutfitData()   { return safeParse(localStorage.getItem(outfitDataKey(profile.id)), {}); }
function saveOutfitData()   { localStorage.setItem(outfitDataKey(profile.id), JSON.stringify(OUTFIT_DATA)); }
function loadCalendarData() { return safeParse(localStorage.getItem(calendarKey(profile.id)), {}); }
function saveCalendarData() { localStorage.setItem(calendarKey(profile.id),   JSON.stringify(CALENDAR_DATA)); }

function getOutfitKey(items) { return items.map(i => i.id).slice().sort().join("|"); }

function getOrInitOutfitData(items, occasion) {
  const key = getOutfitKey(items);
  if (!OUTFIT_DATA[key]) OUTFIT_DATA[key] = { rating: 0, wears: 0, liked: false, occasion: occasion || "" };
  return OUTFIT_DATA[key];
}

/* ══════════════════════════════════════
   TABS
══════════════════════════════════════ */
function initTabs() {
  const tabs   = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.panel));
  });
}

function switchTab(panelId) {
  document.querySelectorAll(".tab-btn").forEach(t => {
    t.classList.toggle("active", t.dataset.panel === panelId);
    t.setAttribute("aria-selected", t.dataset.panel === panelId);
  });
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.classList.toggle("hidden", p.id !== panelId);
  });
}

/* ---------- Calendar helpers ---------- */
function getCurrentWeekDays() {
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { name, date: d.getDate(), key: d.toISOString().split("T")[0] };
  });
}

function saveOutfitToDay(items, dateKey) {
  CALENDAR_DATA[dateKey] = {
    outfitKey:   getOutfitKey(items),
    thumbnail:   items[0].imageDataUrl,
    outfitLabel: items.map(formatItemLabel).join(" | "),
  };
  saveCalendarData();
  renderCalendar();
  renderFilteredOutfits();
}

function removeOutfitFromDay(dateKey) {
  delete CALENDAR_DATA[dateKey];
  saveCalendarData();
  renderCalendar();
  renderFilteredOutfits();
}

/* ---------- Helpers ---------- */
function setUploadMsg(t) { uploadMsg.textContent = t || ""; }
function setOutfitMsg(t) { outfitMsg.textContent = t || ""; }

function titleCase(v) {
  return (v || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatItemLabel(item) {
  const parts = [];
  if      (item.category === "top")       parts.push(`Top (${titleCase(item.topType)})`);
  else if (item.category === "bottom")    parts.push(`Bottom (${titleCase(item.bottomType)})`);
  else if (item.category === "dress")     parts.push(`Dress (${titleCase(item.dressLength)})`);
  else if (item.category === "shoes")     parts.push(`Shoes (${titleCase(item.shoeType)})`);
  else if (item.category === "outerwear") parts.push(`Outerwear (${titleCase(item.outerwearType)})`);
  if (item.sleeveLength) parts.push(titleCase(item.sleeveLength));
  if (item.color)        parts.push(titleCase(item.color));
  return parts.join(" • ");
}

function uuid() {
  return crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function getOccasionClass(occ) {
  return { Casual:"occ-casual", Work:"occ-work", Formal:"occ-formal",
           "Date Night":"occ-date", Sport:"occ-sport", Weekend:"occ-weekend" }[occ] || "occ-default";
}

/* ---------- Conditional fields ---------- */
function updateConditionalFields() {
  const cat = categorySelect.value;
  topTypeGroup.classList.toggle("hidden",       cat !== "top");
  bottomTypeGroup.classList.toggle("hidden",    cat !== "bottom");
  sleeveGroup.classList.toggle("hidden",        !(cat === "top" || cat === "dress"));
  dressLengthGroup.classList.toggle("hidden",   cat !== "dress");
  shoeTypeGroup.classList.toggle("hidden",      cat !== "shoes");
  outerwearTypeGroup.classList.toggle("hidden", cat !== "outerwear");
  if (cat !== "top")       topTypeSelect.value       = "";
  if (cat !== "bottom")    bottomTypeSelect.value    = "";
  if (!(cat === "top" || cat === "dress")) sleeveSelect.value = "";
  if (cat !== "dress")     dressLengthSelect.value   = "";
  if (cat !== "shoes")     shoeTypeSelect.value      = "";
  if (cat !== "outerwear") outerwearTypeSelect.value  = "";
}
categorySelect.addEventListener("change", updateConditionalFields);

/* ---------- Image preview ---------- */
function resetPreview() {
  pendingImageDataUrl = ""; imgPreview.src = ""; imgPreview.style.display = "none";
  previewPlaceholder.style.display = "grid"; fileInput.value = ""; fileNameEl.textContent = "No file chosen";
}

fileInput.addEventListener("change", () => {
  setUploadMsg("");
  const file = fileInput.files && fileInput.files[0];
  fileNameEl.textContent = file ? file.name : "No file chosen";
  if (!file) { resetPreview(); return; }
  if (!file.type.startsWith("image/")) { setUploadMsg("Please upload an image file."); resetPreview(); return; }
  if (ITEMS.length >= MAX_ITEMS) { setUploadMsg(`Closet is full (${MAX_ITEMS} items max).`); resetPreview(); return; }
  const reader = new FileReader();
  reader.onload = () => {
    pendingImageDataUrl = String(reader.result || "");
    imgPreview.src = pendingImageDataUrl; imgPreview.style.display = "block"; previewPlaceholder.style.display = "none";
  };
  reader.readAsDataURL(file);
});

/* ---------- Form ---------- */
function normalizeItemFromForm() {
  const cat          = categorySelect.value;
  const color        = colorSelect.value;
  const occasion     = occasionSelect.value;
  const topType      = topTypeSelect.value;
  const bottomType   = bottomTypeSelect.value;
  const sleeve       = sleeveSelect.value;
  const dressLength  = dressLengthSelect.value;
  const shoeType     = shoeTypeSelect.value;
  const outerwearType = outerwearTypeSelect.value;

  if (!pendingImageDataUrl) return { error: "Choose an image first." };
  if (!cat)   return { error: "Select a category." };
  if (!color) return { error: "Select a color." };

  if (cat === "top")       { if (!topType)  return { error: "Select a top type." };       if (!sleeve) return { error: "Select a sleeve length." }; }
  if (cat === "bottom")    { if (!bottomType) return { error: "Select a bottom type." }; }
  if (cat === "dress")     { if (!sleeve)  return { error: "Select a sleeve length." };   if (!dressLength) return { error: "Select a dress length." }; }
  if (cat === "shoes")     { if (!shoeType) return { error: "Select a shoe type." }; }
  if (cat === "outerwear") { if (!outerwearType) return { error: "Select an outerwear type." }; }

  return {
    item: {
      id: uuid(), imageDataUrl: pendingImageDataUrl,
      category: cat, color, occasion,
      topType:       cat === "top"       ? topType       : "",
      bottomType:    cat === "bottom"    ? bottomType    : "",
      sleeveLength:  (cat === "top" || cat === "dress") ? sleeve : "",
      dressLength:   cat === "dress"     ? dressLength   : "",
      shoeType:      cat === "shoes"     ? shoeType      : "",
      outerwearType: cat === "outerwear" ? outerwearType : "",
    },
  };
}

function resetForm() {
  resetPreview();
  [categorySelect, topTypeSelect, bottomTypeSelect, sleeveSelect, dressLengthSelect,
   colorSelect, occasionSelect, shoeTypeSelect, outerwearTypeSelect].forEach(s => s.value = "");
  updateConditionalFields();
}

saveItemBtn.addEventListener("click", () => {
  setUploadMsg("");
  if (ITEMS.length >= MAX_ITEMS) { setUploadMsg(`Closet is full (${MAX_ITEMS} items max).`); return; }
  const { item, error } = normalizeItemFromForm();
  if (error) { setUploadMsg(error); return; }
  ITEMS.push(item); saveItems(); renderCloset(); updateCounts(); resetForm(); setUploadMsg("Item saved to your closet.");
});

clearClosetBtn.addEventListener("click", () => {
  ITEMS = []; saveItems(); renderCloset(); clearOutfits(); updateCounts(); resetForm(); setUploadMsg("Closet cleared.");
});

/* ---------- Closet toolbar ---------- */
closetSearch.addEventListener("input",     e => { closetSearchText = e.target.value; renderCloset(); });
closetFilterCat.addEventListener("change", e => { closetCatFilter  = e.target.value; renderCloset(); });
closetFilterOcc.addEventListener("change", e => { closetOccFilter  = e.target.value; renderCloset(); });

function getFilteredItems() {
  return ITEMS.filter(item => {
    const label = formatItemLabel(item).toLowerCase();
    const occ   = (item.occasion || "").toLowerCase();
    const matchSearch = !closetSearchText || label.includes(closetSearchText.toLowerCase()) || occ.includes(closetSearchText.toLowerCase());
    const matchCat    = !closetCatFilter  || item.category === closetCatFilter;
    const matchOcc    = !closetOccFilter  || item.occasion  === closetOccFilter;
    return matchSearch && matchCat && matchOcc;
  });
}

/* ---------- Matching rules ---------- */
function isShirt(i)    { return i.category === "top" && i.topType === "shirt"; }
function isLayer(i)    { return i.category === "top" && i.topType === "sweater"; }
function isBottom(i)   { return i.category === "bottom"; }
function isDress(i)    { return i.category === "dress"; }
function isShoe(i)     { return i.category === "shoes"; }
function isOuterwear(i){ return i.category === "outerwear"; }
function layerAllowedWithTop(t)  { return t && t.category === "top" && t.sleeveLength === "short"; }
function layerAllowedWithDress(d){ return d && d.category === "dress" && ["sleeveless","short"].includes(d.sleeveLength); }

const NEUTRALS = ["black","white","gray","blue","beige","cream","brown","denim_blue"];
function colorsCompatible(a, b) { if (!a || !b || a === b) return true; if (NEUTRALS.includes(a) || NEUTRALS.includes(b)) return true; return true; }
function outfitColorsOK(items)   { for (let i = 0; i < items.length; i++) for (let j = i+1; j < items.length; j++) if (!colorsCompatible(items[i].color, items[j].color)) return false; return true; }

function uniqOutfits(list) {
  const seen = new Set(), unique = [];
  for (const items of list) {
    const key = items.map(i => i.id).slice().sort().join("|");
    if (!seen.has(key)) { seen.add(key); unique.push(items); }
  }
  return unique;
}

function generateAllClothingOutfits() {
  const shirts = ITEMS.filter(isShirt), layers = ITEMS.filter(isLayer),
        bottoms = ITEMS.filter(isBottom), dresses = ITEMS.filter(isDress);
  const out = [];
  shirts.forEach(s => {
    bottoms.forEach(b => out.push([s, b]));
    if (layerAllowedWithTop(s)) layers.forEach(l => bottoms.forEach(b => out.push([l, s, b])));
  });
  dresses.forEach(d => {
    out.push([d]);
    if (layerAllowedWithDress(d)) layers.forEach(l => out.push([l, d]));
  });
  return uniqOutfits(out.filter(outfitColorsOK));
}

function generateOutfits(selected) {
  if (isShoe(selected)) {
    return uniqOutfits(generateAllClothingOutfits().map(items => [selected, ...items]));
  }
  if (isOuterwear(selected)) {
    return uniqOutfits(
      generateAllClothingOutfits()
        .filter(items => outfitColorsOK([selected, ...items]))
        .map(items => [selected, ...items])
    );
  }
  const shirts = ITEMS.filter(isShirt), layers = ITEMS.filter(isLayer),
        bottoms = ITEMS.filter(isBottom), dresses = ITEMS.filter(isDress);
  const out = [];
  function add(items) {
    if (!items.some(i => i.id === selected.id)) return;
    if (!outfitColorsOK(items)) return;
    out.push(items);
  }
  if (isLayer(selected)) {
    shirts.forEach(t => { if (!layerAllowedWithTop(t)) return; bottoms.forEach(b => add([selected, t, b])); });
    dresses.forEach(d => { if (!layerAllowedWithDress(d)) return; add([selected, d]); });
    return uniqOutfits(out);
  }
  if (isShirt(selected)) {
    bottoms.forEach(b => add([selected, b]));
    if (layerAllowedWithTop(selected)) layers.forEach(l => bottoms.forEach(b => add([l, selected, b])));
    return uniqOutfits(out);
  }
  if (isDress(selected)) {
    add([selected]);
    if (layerAllowedWithDress(selected)) layers.forEach(l => add([l, selected]));
    return uniqOutfits(out);
  }
  if (isBottom(selected)) {
    shirts.forEach(t => { add([t, selected]); if (layerAllowedWithTop(t)) layers.forEach(l => add([l, t, selected])); });
    return uniqOutfits(out);
  }
  return uniqOutfits(out);
}

function getCompleteTheLook(items) {
  const ids = new Set(items.map(i => i.id));
  return {
    shoes:     ITEMS.filter(i => isShoe(i)      && !ids.has(i.id)),
    outerwear: ITEMS.filter(i => isOuterwear(i)  && !ids.has(i.id)),
  };
}

/* ---------- Outfit occasion ---------- */
function getOutfitOccasion(items) {
  const occs = items.map(i => i.occasion).filter(Boolean);
  if (!occs.length) return "";
  const freq = {};
  occs.forEach(o => { freq[o] = (freq[o] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/* ---------- Occasion filter bar ---------- */
function buildOccasionFilterBar(outfits) {
  occasionFilterBar.innerHTML = "";
  const present = new Set(["All"]);
  outfits.forEach(items => { const o = getOutfitOccasion(items); if (o) present.add(o); });
  if (present.size <= 1) return;
  OCCASIONS_LIST.forEach(occ => {
    if (!present.has(occ)) return;
    const btn = document.createElement("button");
    btn.className   = "filter-btn" + (activeOccasionFilter === occ ? " active" : "");
    btn.textContent = occ;
    btn.addEventListener("click", () => {
      activeOccasionFilter = occ;
      buildOccasionFilterBar(lastRenderedOutfits);
      renderFilteredOutfits();
    });
    occasionFilterBar.appendChild(btn);
  });
}

/* ---------- Filtered outfit rendering ---------- */
function renderFilteredOutfits() {
  outfitsGrid.innerHTML = "";
  const filtered = activeOccasionFilter === "All"
    ? lastRenderedOutfits
    : lastRenderedOutfits.filter(items => getOutfitOccasion(items) === activeOccasionFilter);
  if (!filtered.length) { setOutfitMsg("No outfits found for this occasion."); return; }
  const total = lastRenderedOutfits.length;
  setOutfitMsg(activeOccasionFilter === "All"
    ? `Found ${total} outfit${total === 1 ? "" : "s"}.`
    : `Showing ${filtered.length} of ${total} outfit${total === 1 ? "" : "s"}.`
  );
  filtered.forEach(items => outfitsGrid.appendChild(renderOutfitCard(items, getOutfitOccasion(items))));
}

/* ---------- Outfit card ---------- */
function renderOutfitCard(items, occasion) {
  const key  = getOutfitKey(items);
  const data = getOrInitOutfitData(items, occasion);
  const card = document.createElement("div");
  card.className = "outfit-card";

  // Image grid
  const count = items.length;
  const grid  = document.createElement("div");
  grid.className = "outfit-items " + (count === 1 ? "one" : count === 2 ? "two" : count === 3 ? "three" : count === 4 ? "four" : "many");
  items.forEach(item => {
    const img = document.createElement("img");
    img.src = item.imageDataUrl; img.alt = formatItemLabel(item);
    grid.appendChild(img);
  });
  card.appendChild(grid);

  // Occasion tag
  if (occasion) {
    const tag = document.createElement("span");
    tag.className = `occasion-tag ${getOccasionClass(occasion)}`; tag.textContent = occasion;
    card.appendChild(tag);
  }

  // Meta
  const meta = document.createElement("div");
  meta.className = "outfit-meta"; meta.textContent = items.map(formatItemLabel).join(" | ");
  card.appendChild(meta);

  // Stars
  const ratingRow = document.createElement("div"); ratingRow.className = "outfit-rating-row";
  const rl = document.createElement("span"); rl.className = "rating-label"; rl.textContent = "Rate";
  ratingRow.appendChild(rl);
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("button");
    star.className = "star-btn" + (i <= data.rating ? " filled" : "");
    star.setAttribute("aria-label", `${i} star`); star.textContent = "★";
    const v = i;
    star.addEventListener("click", () => {
      OUTFIT_DATA[key].rating = OUTFIT_DATA[key].rating === v ? 0 : v;
      saveOutfitData(); renderFilteredOutfits(); renderStyleProfile();
    });
    ratingRow.appendChild(star);
  }
  card.appendChild(ratingRow);

  // Like + Wear
  const footer   = document.createElement("div"); footer.className = "outfit-footer";
  const likeBtn  = document.createElement("button");
  likeBtn.className   = "like-outfit-btn" + (data.liked ? " liked" : "");
  likeBtn.textContent = data.liked ? "♥ Liked" : "♡ Like";
  likeBtn.addEventListener("click", () => {
    OUTFIT_DATA[key].liked = !OUTFIT_DATA[key].liked;
    saveOutfitData(); renderFilteredOutfits(); renderStyleProfile();
  });
  const wearArea  = document.createElement("div"); wearArea.className = "wear-area";
  const wearCount = document.createElement("span"); wearCount.className = "wear-count";
  wearCount.textContent = `${data.wears} wear${data.wears !== 1 ? "s" : ""}`;
  const wearBtn = document.createElement("button"); wearBtn.className = "wear-btn"; wearBtn.textContent = "+ Log wear";
  wearBtn.addEventListener("click", () => {
    OUTFIT_DATA[key].wears += 1;
    saveOutfitData(); renderFilteredOutfits(); renderStyleProfile();
  });
  wearArea.appendChild(wearCount); wearArea.appendChild(wearBtn);
  footer.appendChild(likeBtn); footer.appendChild(wearArea);
  card.appendChild(footer);

  // Complete the look
  const { shoes, outerwear } = getCompleteTheLook(items);
  const completeItems = [...shoes, ...outerwear];
  if (completeItems.length) {
    const cl = document.createElement("div"); cl.className = "complete-look";
    const cll = document.createElement("span"); cll.className = "complete-look-label"; cll.textContent = "Complete the look";
    cl.appendChild(cll);
    const clRow = document.createElement("div"); clRow.className = "complete-look-items";
    completeItems.forEach(ci => {
      const thumb = document.createElement("div"); thumb.className = "complete-look-thumb"; thumb.title = formatItemLabel(ci);
      const tImg  = document.createElement("img"); tImg.src = ci.imageDataUrl; tImg.alt = formatItemLabel(ci);
      thumb.appendChild(tImg); clRow.appendChild(thumb);
    });
    cl.appendChild(clRow); card.appendChild(cl);
  }

  // Plan for the week
  const planRow   = document.createElement("div"); planRow.className = "plan-row";
  const planLabel = document.createElement("span"); planLabel.className = "plan-label"; planLabel.textContent = "Plan for";
  planRow.appendChild(planLabel);
  const planDays = document.createElement("div"); planDays.className = "plan-days";
  getCurrentWeekDays().forEach(({ name, key: dayKey }) => {
    const btn      = document.createElement("button");
    const planned  = CALENDAR_DATA[dayKey] && CALENDAR_DATA[dayKey].outfitKey === key;
    btn.className  = "plan-day-btn" + (planned ? " planned" : "");
    btn.textContent = name;
    btn.addEventListener("click", () => {
      if (CALENDAR_DATA[dayKey] && CALENDAR_DATA[dayKey].outfitKey === key) {
        removeOutfitFromDay(dayKey);
      } else {
        saveOutfitToDay(items, dayKey);
      }
    });
    planDays.appendChild(btn);
  });
  planRow.appendChild(planDays); card.appendChild(planRow);

  return card;
}

/* ---------- Surprise Me ---------- */
surpriseMeBtn.addEventListener("click", () => {
  if (!ITEMS.length) { switchTab("panel-matches"); setOutfitMsg("Add items to your closet first."); return; }
  const seen = new Set(), all = [];
  ITEMS.forEach(item => generateOutfits(item).forEach(combo => {
    const k = getOutfitKey(combo);
    if (!seen.has(k)) { seen.add(k); all.push(combo); }
  }));
  if (!all.length) { switchTab("panel-matches"); setOutfitMsg("Not enough items to match. Add more pieces!"); return; }
  const random = all[Math.floor(Math.random() * all.length)];
  lastRenderedOutfits  = [random];
  lastSelectedItem     = null;
  activeOccasionFilter = "All";
  selectedLabel.textContent   = "✦ Surprise outfit";
  occasionFilterBar.innerHTML = "";
  outfitsGrid.innerHTML       = "";
  setOutfitMsg("Here's a random outfit from your closet!");
  outfitsGrid.appendChild(renderOutfitCard(random, getOutfitOccasion(random)));
  switchTab("panel-matches");
});

/* ---------- Style Profile ---------- */
function renderStyleProfile() {
  styleProfileBars.innerHTML = "";
  const occasions = OCCASIONS_LIST.slice(1);
  const scores = {};
  occasions.forEach(occ => {
    const entries = Object.values(OUTFIT_DATA).filter(d => d.occasion === occ);
    if (!entries.length) { scores[occ] = 0; return; }
    const liked  = (entries.filter(d => d.liked).length / entries.length) * 40;
    const rating = (entries.reduce((s, d) => s + d.rating, 0) / entries.length / 5) * 40;
    const wears  = Math.min(20, (entries.reduce((s, d) => s + d.wears, 0) / entries.length) * 4);
    scores[occ]  = Math.round(liked + rating + wears);
  });
  const hasData = Object.values(scores).some(s => s > 0);
  if (!hasData) { styleProfileMsg.textContent = "Rate and wear outfits to build your profile."; styleProfileMsg.style.display = ""; return; }
  styleProfileMsg.style.display = "none";
  const maxScore = Math.max(...Object.values(scores), 1);
  Object.entries(scores).sort((a, b) => b[1] - a[1]).forEach(([occ, score]) => {
    const pct   = Math.round((score / maxScore) * 100);
    const row   = document.createElement("div"); row.className = "style-bar-row";
    const lbl   = document.createElement("span"); lbl.className = "style-bar-label"; lbl.textContent = occ;
    const wrap  = document.createElement("div"); wrap.className = "style-bar-wrap";
    const bar   = document.createElement("div"); bar.className = `style-bar ${getOccasionClass(occ)}`; bar.style.width = `${pct}%`;
    const pctEl = document.createElement("span"); pctEl.className = "style-bar-pct"; pctEl.textContent = `${pct}%`;
    wrap.appendChild(bar); row.appendChild(lbl); row.appendChild(wrap); row.appendChild(pctEl);
    styleProfileBars.appendChild(row);
  });
}

/* ---------- Calendar ---------- */
function renderCalendar() {
  calendarGrid.innerHTML = "";
  const week     = getCurrentWeekDays();
  const todayKey = new Date().toISOString().split("T")[0];
  const hasAny   = week.some(({ key }) => CALENDAR_DATA[key]);
  if (hasAny) calendarMsg.style.display = "none"; else calendarMsg.style.display = "";

  week.forEach(({ name, date, key }) => {
    const entry   = CALENDAR_DATA[key];
    const isToday = key === todayKey;
    const day     = document.createElement("div");
    day.className = "calendar-day" + (isToday ? " today" : "");
    const dn = document.createElement("div"); dn.className = "cal-day-name"; dn.textContent = name;
    const dd = document.createElement("div"); dd.className = "cal-day-date"; dd.textContent = date;
    day.appendChild(dn); day.appendChild(dd);
    if (entry && entry.thumbnail) {
      const thumb = document.createElement("div"); thumb.className = "cal-outfit-thumb";
      const img   = document.createElement("img");
      img.src = entry.thumbnail; img.alt = entry.outfitLabel || "Outfit"; img.title = entry.outfitLabel || "";
      const rmv = document.createElement("button"); rmv.className = "cal-remove-btn"; rmv.textContent = "×"; rmv.title = "Remove";
      rmv.addEventListener("click", e => { e.stopPropagation(); removeOutfitFromDay(key); });
      thumb.appendChild(img); thumb.appendChild(rmv); day.appendChild(thumb);
    } else {
      const empty = document.createElement("div"); empty.className = "cal-empty"; empty.textContent = "—";
      day.appendChild(empty);
    }
    calendarGrid.appendChild(day);
  });
}

/* ---------- Closet rendering ---------- */
function updateCounts() { closetCountEl.textContent = `${ITEMS.length}/${MAX_ITEMS}`; }

function clearOutfits() {
  outfitsGrid.innerHTML = ""; occasionFilterBar.innerHTML = "";
  selectedLabel.textContent = "Select an item from your closet.";
  activeOccasionFilter = "All"; lastRenderedOutfits = []; lastSelectedItem = null;
  setOutfitMsg("");
}

function createBtn(label, cls, onClick) {
  const b = document.createElement("button"); b.className = cls; b.textContent = label;
  b.addEventListener("click", onClick); return b;
}

function renderCloset() {
  closetGrid.innerHTML = "";
  const visible = getFilteredItems();
  if (!visible.length) {
    const empty = document.createElement("p"); empty.className = "muted";
    empty.textContent = ITEMS.length ? "No items match your filter." : "Your closet is empty. Add a few pieces to get started.";
    closetGrid.appendChild(empty); updateCounts(); return;
  }
  visible.forEach(item => {
    const card = document.createElement("div"); card.className = "item-card";
    const img  = document.createElement("img"); img.src = item.imageDataUrl; img.alt = formatItemLabel(item);
    const body = document.createElement("div"); body.className = "item-body";
    const meta = document.createElement("div"); meta.className = "item-meta"; meta.textContent = formatItemLabel(item);
    body.appendChild(meta);
    if (item.occasion) {
      const tag = document.createElement("span");
      tag.className = `occasion-tag ${getOccasionClass(item.occasion)}`;
      tag.style.marginBottom = "10px"; tag.textContent = item.occasion;
      body.appendChild(tag);
    }
    const actions = document.createElement("div"); actions.className = "item-actions";
    actions.appendChild(createBtn("Use", "primary", () => {
      const outfits = generateOutfits(item);
      renderOutfits(item, outfits);
      switchTab("panel-matches"); // auto-switch to Matches
    }));
    actions.appendChild(createBtn("Delete", "danger", () => {
      ITEMS = ITEMS.filter(c => c.id !== item.id); saveItems(); renderCloset(); clearOutfits(); updateCounts();
    }));
    body.appendChild(actions); card.appendChild(img); card.appendChild(body); closetGrid.appendChild(card);
  });
  updateCounts();
}

function renderOutfits(selected, outfits) {
  lastSelectedItem = selected; lastRenderedOutfits = outfits; activeOccasionFilter = "All";
  selectedLabel.textContent = selected ? `Selected: ${formatItemLabel(selected)}` : "✦ Surprise outfit";
  if (!outfits.length) {
    occasionFilterBar.innerHTML = ""; outfitsGrid.innerHTML = "";
    setOutfitMsg("No outfits found for this item yet."); return;
  }
  buildOccasionFilterBar(outfits); renderFilteredOutfits();
}

/* ---------- Init ---------- */
updateConditionalFields();
renderCloset();
updateCounts();
clearOutfits();
renderCalendar();
renderStyleProfile();
initTabs();
