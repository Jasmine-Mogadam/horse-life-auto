// Horse Breeding Planner App
// Data structure:
// {
//   target: { name, size, gender, traits: [trait1, trait2, ...] },
//   breeding: [ { name, size, gender, traits: {trait1: true/false, ...} }, ... ]
// }
import Horse from "./scripts/horse.js";

const DATA_FILE = "horse-info.json";

async function readData() {
  if (window.horseAPI) {
    const data = await window.horseAPI.read();
    return data ? JSON.parse(data) : null;
  } else {
    // fallback to localStorage for browser demo
    const data = localStorage.getItem(DATA_FILE);
    return data ? JSON.parse(data) : null;
  }
}

async function writeData(data) {
  if (window.horseAPI) {
    await window.horseAPI.write(JSON.stringify(data, null, 2));
  } else {
    localStorage.setItem(DATA_FILE, JSON.stringify(data));
  }
}

function getDefaultData() {
  return {
    target: {
      name: "Dream Horse",
      size: "Medium",
      gender: "Mare",
      traits: ["Speed", "Color", "Temperament"],
    },
    breeding: [],
  };
}

let appData = null;

async function loadApp() {
  appData = await readData();
  if (!appData) {
    appData = getDefaultData();
    await writeData(appData);
  }
  // Convert breeding horses to Horse instances
  if (Array.isArray(appData.breeding)) {
    appData.breeding = appData.breeding.map((h) =>
      h instanceof Horse ? h : Horse.fromObject(h)
    );
  }
  renderTable();
}

function renderMissingTraits() {
  const container = document.getElementById("missingTraitsContainer");
  const { target, breeding } = appData;
  // Find traits not covered by any horse
  const missing = target.traits.filter(
    (trait) => !breeding.some((horse) => horse.traits && horse.traits[trait])
  );
  if (missing.length === 0) {
    container.innerHTML =
      '<div class="alert alert-success mb-0">All target traits are covered by at least one breeding horse.</div>';
  } else {
    container.innerHTML =
      '<div class="alert alert-warning mb-0"><b>Missing Traits:</b> ' +
      missing
        .map((t) => `<span class="badge bg-danger me-1">${t}</span>`)
        .join(" ") +
      "</div>";
  }
}

let tableColumnsHtml = "";
let tableHeaderHtml = "";
let lastTraits = [];

function buildTableColumns(target) {
  let html = "";
  html += '<th style="width:65px;font-size:13px;">% Match</th>';
  html += '<th style="width:40px;font-size:13px;"></th>'; // drag handle
  html += '<th style="width:110px;font-size:13px;">Name</th>';
  html += '<th style="width:90px;font-size:13px;">Size</th>'; // slightly larger
  html += '<th style="width:52px;font-size:13px;">Gender</th>'; // smaller gender column
  for (const trait of target.traits) {
    html += `<th class="trait-header" style="width:60px;word-break:break-word;white-space:normal;font-size:13px;">${trait}</th>`;
  }
  // Add body color headers here, before delete btn
  for (const part of REQUIRED_BODY_PARTS) {
    // Get color name and hex for the target horse
    const colorName = target.bodyColors?.[part] || "";
    const colorObj = colorOptions.find((c) => c.name === colorName);
    const colorHex = colorObj ? colorObj.hex : "#fff";
    // Add header cell with color swatch and name (smaller, unbolded)
    html += `<th class="trait-header" style="width:60px;word-break:break-word;white-space:normal;font-size:13px; font-weight:normal;">
      <div style='display:flex;flex-direction:column;align-items:center;gap:2px;'>
        <span>${part} Color</span>
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="display:inline-block;width:16px;height:16px;border:1px solid #ccc;background:${colorHex};margin-right:2px;"></span>
          <span style='font-size:11px;font-weight:normal;'>${colorName}</span>
        </span>
      </div>
    </th>`;
  }
  html += '<th style="width:40px;font-size:13px;"></th>'; // delete btn (fit contents)
  return html;
}

const REQUIRED_BODY_PARTS = [
  "Coat Top",
  "Coat Bottom",
  "Hair",
  "Hoof",
  "Nose",
  "Sock",
  "Paint",
  "Pattern",
  "Keratin",
];
let colorOptions = [];

// Fetch color options at startup
(async function fetchColors() {
  if (window.horseAPI && window.horseAPI.getColors) {
    colorOptions = await window.horseAPI.getColors();
  }
})();

function setTableScrollDivWidth(scrollDiv) {
  // Remove explicit width, let it be 100%
  scrollDiv.style.width = "";
}

function renderTable(forceRebuildColumns = false) {
  renderMissingTraits();
  const container = document.getElementById("horseTableContainer");
  const { target, breeding } = appData;
  // Save focus/selection state
  const active = document.activeElement;
  let focusInfo = null;
  if (active && active.matches("[data-field][data-idx]")) {
    focusInfo = {
      idx: active.getAttribute("data-idx"),
      field: active.getAttribute("data-field"),
      selectionStart: active.selectionStart,
      selectionEnd: active.selectionEnd,
    };
  }
  // Only rebuild columns if traits/columns have changed
  if (
    forceRebuildColumns ||
    JSON.stringify(target.traits) !== JSON.stringify(lastTraits)
  ) {
    tableColumnsHtml = buildTableColumns(target);
    lastTraits = [...target.traits];
  }

  // Clear container
  container.innerHTML = "";
  // Create scrollable div
  const scrollDiv = document.createElement("div");
  //scrollDiv.style.overflowX = "auto";
  // Do not set explicit width
  setTableScrollDivWidth(scrollDiv);
  // Create table
  const table = document.createElement("table");
  table.className = "table table-bordered align-middle";
  table.style.minWidth = "1200px";
  table.style.tableLayout = "fixed";
  table.style.width = "100%";
  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  // Columns
  headerRow.innerHTML = tableColumnsHtml;
  // No need to append body color headers here anymore
  thead.append(headerRow);
  table.append(thead);
  // Body
  const tbody = document.createElement("tbody");
  tbody.id = "breedingTableBody";
  breeding.forEach((horse, idx) => {
    // Calculate match percent
    let match = 0;
    let total = target.traits.length + 2 + REQUIRED_BODY_PARTS.length; // +2 for size/gender, +body parts
    for (const trait of target.traits) {
      if (horse.traits[trait]) match++;
    }
    if (horse.size === target.size) match++;
    if (horse.gender === target.gender) match++;
    // Count body color matches
    REQUIRED_BODY_PARTS.forEach((part) => {
      if (
        (horse.bodyColors?.[part] || "") === (target.bodyColors?.[part] || "")
      ) {
        match++;
      }
    });
    let percent = total > 0 ? (100 * match) / total : 0;
    // Color for percent cell
    const bgColor = `background: linear-gradient(90deg, #fff ${
      100 - percent
    }%, #b6fcb6 ${percent}%);`;
    const tr = document.createElement("tr");
    tr.className = "horse-row";
    tr.setAttribute("data-idx", idx);
    // % Match
    const tdPercent = document.createElement("td");
    tdPercent.style = bgColor;
    tdPercent.innerHTML = `<b>${percent.toFixed(2)}%</b>`;
    tr.append(tdPercent);
    // Drag handle
    const tdDrag = document.createElement("td");
    tdDrag.className = "draggable";
    tdDrag.style.width = "40px"; // fit contents
    tdDrag.style.maxWidth = "40px";
    tdDrag.style.minWidth = "40px";
    tdDrag.style.textAlign = "center";
    tdDrag.innerHTML = '<i class="fa fa-bars"></i>';
    tr.append(tdDrag);
    // Name
    const tdName = document.createElement("td");
    tdName.style.width = "110px"; // shorter
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "form-control form-control-sm";
    nameInput.value = horse.name;
    nameInput.setAttribute("data-field", "name");
    nameInput.setAttribute("data-idx", idx);
    tdName.append(nameInput);
    tr.append(tdName);
    // Size
    const tdSize = document.createElement("td");
    tdSize.style.width = "105px"; // match header
    let sizeMatch = horse.size === target.size;
    tdSize.style = sizeMatch ? "background-color:#b6fcb6" : "";
    const sizeSelect = document.createElement("select");
    sizeSelect.className = "form-select form-select-sm";
    sizeSelect.setAttribute("data-field", "size");
    sizeSelect.setAttribute("data-idx", idx);
    [
      "Big",
      "Draft",
      "Giant",
      "Huge",
      "Little",
      "Normal",
      "Small",
      "Teeny",
    ].forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (horse.size === opt) o.selected = true;
      sizeSelect.append(o);
    });
    tdSize.append(sizeSelect);
    tr.append(tdSize);
    // Gender
    const tdGender = document.createElement("td");
    tdGender.style.width = "55px"; // match header, smaller
    let genderMatch = horse.gender === target.gender;
    tdGender.style = genderMatch ? "background-color:#b6fcb6" : "";
    // Flexbox centering for gender select
    const genderFlex = document.createElement("div");
    genderFlex.style.display = "flex";
    genderFlex.style.justifyContent = "center";
    genderFlex.style.alignItems = "center";
    genderFlex.style.width = "100%";
    genderFlex.style.height = "100%";
    const genderSelect = document.createElement("select");
    genderSelect.className = "form-select form-select-sm gender-select";
    genderSelect.setAttribute("data-field", "gender");
    genderSelect.setAttribute("data-idx", idx);
    genderSelect.style.appearance = "none";
    genderSelect.style.webkitAppearance = "none";
    genderSelect.style.mozAppearance = "none";
    genderSelect.style.background = "none";
    genderSelect.style.paddingRight = "0";
    genderSelect.style.textAlign = "center";
    genderSelect.style.textAlignLast = "left";
    genderSelect.style.width = "32px";
    genderSelect.style.height = "32px";
    genderSelect.style.minWidth = "32px";
    genderSelect.style.minHeight = "32px";
    genderSelect.style.maxWidth = "32px";
    genderSelect.style.maxHeight = "32px";
    genderSelect.style.borderRadius = "6px";
    genderSelect.style.display = "inline-block";
    [
      { value: "Female", label: "\u2640", color: "#ffb6d5" }, // pink
      { value: "Male", label: "\u2642", color: "#8ecaff" }, // blue
    ].forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if (horse.gender === opt.value) o.selected = true;
      o.setAttribute("data-color", opt.color);
      genderSelect.append(o);
    });
    // Set initial background color
    genderSelect.style.backgroundColor =
      horse.gender === "Female"
        ? "#ffb6d5"
        : horse.gender === "Male"
        ? "#8ecaff"
        : "";
    // Change color on select
    genderSelect.addEventListener("change", function () {
      this.style.backgroundColor =
        this.value === "Female"
          ? "#ffb6d5"
          : this.value === "Male"
          ? "#8ecaff"
          : "";
    });
    genderFlex.append(genderSelect);
    tdGender.append(genderFlex);
    tr.append(tdGender);
    // Traits
    for (const trait of target.traits) {
      const tdTrait = document.createElement("td");
      tdTrait.style =
        (horse.traits[trait] === true ? "background-color:#b6fcb6;" : "") +
        "width:60px;"; // half size
      // Flexbox centering for checkbox
      const flexDiv = document.createElement("div");
      flexDiv.style.display = "flex";
      flexDiv.style.justifyContent = "center";
      flexDiv.style.alignItems = "center";
      flexDiv.style.width = "100%";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.setAttribute("data-field", "trait");
      cb.setAttribute("data-trait", trait);
      cb.setAttribute("data-idx", idx);
      if (horse.traits[trait] === true) cb.checked = true;
      flexDiv.append(cb);
      tdTrait.append(flexDiv);
      tr.append(tdTrait);
    }
    // Body color dropdowns
    if (!horse.bodyColors) horse.bodyColors = {};
    REQUIRED_BODY_PARTS.forEach((part) => {
      const td = document.createElement("td");
      const match =
        (horse.bodyColors[part] || "") === (target.bodyColors?.[part] || "");
      td.style.backgroundColor = match ? "#b6fcb6" : "";
      // Container for swatch and dropdown, flex column
      const colorCol = document.createElement("div");
      colorCol.style.display = "flex";
      colorCol.style.flexDirection = "column";
      colorCol.style.alignItems = "center";
      colorCol.style.justifyContent = "center";
      colorCol.style.gap = "2px";
      colorCol.style.position = "relative"; // Ensure dropdown is positioned relative to this container
      // Swatch as dropdown trigger
      const swatchBtn = document.createElement("button");
      swatchBtn.type = "button";
      swatchBtn.style.display = "inline-block";
      swatchBtn.style.width = "18px";
      swatchBtn.style.height = "18px";
      swatchBtn.style.border = "1px solid #ccc";
      swatchBtn.style.background =
        colorOptions.find((c) => c.name === horse.bodyColors[part])?.hex ||
        "#fff";
      swatchBtn.style.padding = "0";
      swatchBtn.style.margin = "0";
      swatchBtn.style.cursor = "pointer";
      swatchBtn.style.borderRadius = "4px";
      swatchBtn.style.position = "relative";
      // Hidden dropdown absolutely positioned over the swatch
      const select = document.createElement("select");
      select.className = "form-select form-select-sm d-inline-block";
      select.style.width = "60px";
      select.style.fontSize = "12px";
      select.style.position = "absolute";
      select.style.left = "0";
      select.style.top = "0";
      select.style.zIndex = "10";
      select.style.opacity = "0";
      select.style.pointerEvents = "none";
      select.setAttribute("data-body-part", part);
      select.setAttribute("data-idx", idx);
      colorOptions.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.name;
        o.textContent = opt.name;
        if (horse.bodyColors[part] === opt.name) o.selected = true;
        o.setAttribute("data-hex", opt.hex);
        select.append(o);
      });
      // Show dropdown on swatch click
      swatchBtn.addEventListener("click", function (e) {
        select.style.opacity = "1";
        select.style.pointerEvents = "auto";
        select.focus();
        swatchBtn.style.outline = "2px solid #888";
      });
      // Hide dropdown on blur
      select.addEventListener("blur", function () {
        select.style.opacity = "0";
        select.style.pointerEvents = "none";
        swatchBtn.style.outline = "none";
      });
      // Change color on select
      select.addEventListener("change", async function () {
        horse.bodyColors[part] = this.value;
        swatchBtn.style.background =
          colorOptions.find((c) => c.name === this.value)?.hex || "#fff";
        select.style.opacity = "0";
        select.style.pointerEvents = "none";
        swatchBtn.style.outline = "none";
        await writeData(appData);
        renderTable();
      });
      // Position select absolutely over the swatch
      swatchBtn.style.position = "relative";
      select.style.left = "0";
      select.style.top = "0";
      select.style.margin = "0";
      select.style.transform = "translateY(-2px)";
      colorCol.append(swatchBtn);
      colorCol.append(select);
      // Color name in small text
      const colorName = horse.bodyColors[part] || "";
      const colorLabel = document.createElement("span");
      colorLabel.textContent = colorName;
      colorLabel.style.fontSize = "9px";
      colorLabel.style.fontWeight = "normal";
      colorLabel.style.marginTop = "1px";
      colorLabel.style.wordBreak = "break-word";
      colorCol.append(colorLabel);
      td.append(colorCol);
      tr.append(td);
    });
    // Delete
    const tdDel = document.createElement("td");
    tdDel.style.width = "40px"; // fit contents
    tdDel.style.maxWidth = "40px";
    tdDel.style.minWidth = "40px";
    tdDel.style.textAlign = "center";
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-sm delete-horse";
    delBtn.setAttribute("data-idx", idx);
    delBtn.innerHTML = '<i class="fa fa-trash"></i>';
    tdDel.append(delBtn);
    tr.append(tdDel);
    tbody.append(tr);
  });
  table.append(tbody);
  scrollDiv.append(table);
  container.innerHTML = "";
  container.append(scrollDiv);
  makeTableDraggable();
  // Restore focus/selection state
  if (focusInfo) {
    const selector = `[data-field="${focusInfo.field}"][data-idx="${focusInfo.idx}"]`;
    const el = container.querySelector(selector);
    if (el) {
      el.focus();
      if (el.setSelectionRange && focusInfo.selectionStart != null) {
        el.setSelectionRange(focusInfo.selectionStart, focusInfo.selectionEnd);
      }
    }
  }
  // Update width on resize
  if (!window._tableResizeListener) {
    window._tableResizeListener = true;
    window.addEventListener("resize", () => {
      const scrollDiv = document.getElementById(
        "horseTableContainer"
      ).firstElementChild;
      if (scrollDiv) setTableScrollDivWidth(scrollDiv);
    });
  }
}

function makeTableDraggable() {
  const tbody = document.getElementById("breedingTableBody");
  if (!tbody) return;
  Sortable.create(tbody, {
    handle: ".draggable",
    animation: 150,
    onEnd: async function (evt) {
      const moved = appData.breeding.splice(evt.oldIndex, 1)[0];
      appData.breeding.splice(evt.newIndex, 0, moved);
      await writeData(appData);
      renderTable();
    },
  });
}

// Event listeners

document.getElementById("addHorseBtn").addEventListener("click", async () => {
  const { target } = appData;
  const newHorse = new Horse({
    name: "New Horse",
    size: target.size,
    gender: target.gender,
    traits: target.traits,
  });
  appData.breeding.push(newHorse);
  await writeData(appData);
  renderTable();
});

document
  .getElementById("horseTableContainer")
  .addEventListener("input", async (e) => {
    const idx = e.target.getAttribute("data-idx");
    const field = e.target.getAttribute("data-field");
    if (idx !== null && field) {
      const horse = appData.breeding[idx];
      if (field === "name" || field === "size") {
        horse[field] = e.target.value;
      } else if (field === "gender") {
        horse[field] = e.target.value;
      }
      await writeData(appData);
      renderTable(); // Re-render to update colors and percent
    }
  });

document
  .getElementById("horseTableContainer")
  .addEventListener("change", async (e) => {
    const idx = e.target.getAttribute("data-idx");
    const field = e.target.getAttribute("data-field");
    if (idx !== null && field === "trait") {
      const trait = e.target.getAttribute("data-trait");
      const horse = appData.breeding[idx];
      horse.setTrait(trait, e.target.checked);
      await writeData(appData);
      renderTable(); // Re-render to update colors and percent
    }
  });

document
  .getElementById("horseTableContainer")
  .addEventListener("click", async (e) => {
    if (e.target.closest(".delete-horse")) {
      const idx = e.target.closest(".delete-horse").getAttribute("data-idx");
      appData.breeding.splice(idx, 1);
      await writeData(appData);
      renderTable();
    }
  });

// Settings modal logic
const settingsModal = new bootstrap.Modal(
  document.getElementById("settingsModal")
);
document.getElementById("settingsBtn").addEventListener("click", () => {
  showSettingsModal();
});

async function renderBodyColorsSettings() {
  const container = document.getElementById("bodyColorsSettings");
  container.innerHTML = "";
  const bodyColors = appData.target.bodyColors || {};
  REQUIRED_BODY_PARTS.forEach((part) => {
    const row = document.createElement("div");
    row.className = "d-flex align-items-center mb-2";
    // Label
    const label = document.createElement("label");
    label.className = "me-2";
    label.textContent = part;
    label.style.width = "120px";
    row.append(label);
    // Color swatch
    const swatch = document.createElement("span");
    swatch.className = "me-2";
    swatch.style.display = "inline-block";
    swatch.style.width = "24px";
    swatch.style.height = "24px";
    swatch.style.border = "1px solid #ccc";
    swatch.style.background =
      bodyColors[part] && colorOptions.find((c) => c.name === bodyColors[part])
        ? colorOptions.find((c) => c.name === bodyColors[part]).hex
        : "#fff";
    row.append(swatch);
    // Dropdown
    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    select.style.width = "200px";
    select.setAttribute("data-body-part", part);
    colorOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.name;
      o.textContent = `${opt.name} (${opt.hex})`;
      if (bodyColors[part] === opt.name) o.selected = true;
      o.setAttribute("data-hex", opt.hex);
      select.append(o);
    });
    select.addEventListener("change", function () {
      swatch.style.background =
        colorOptions.find((c) => c.name === this.value)?.hex || "#fff";
    });
    row.append(select);
    container.append(row);
  });
}

function showSettingsModal() {
  const { target } = appData;
  document.getElementById("targetName").value = target.name;
  document.getElementById("targetSize").value = target.size;
  // Set gender radio
  if (target.gender === "Female") {
    document.getElementById("targetGenderFemale").checked = true;
  } else {
    document.getElementById("targetGenderMale").checked = true;
  }
  renderTraitsList();
  renderBodyColorsSettings();
  settingsModal.show();
}

function renderTraitsList() {
  const list = document.getElementById("traitsList");
  list.innerHTML = "";
  appData.target.traits.forEach((trait, idx) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center";
    li.setAttribute("data-idx", idx);
    li.innerHTML = `
            <input type="text" class="form-control form-control-sm flex-grow-1 trait-edit-input" value="${trait}" data-idx="${idx}">
            <button class="btn btn-sm btn-outline-danger ms-2 remove-trait"><i class="fa fa-trash"></i></button>
            <span class="ms-2 move-trait" style="cursor:grab"><i class="fa fa-bars"></i></span>
        `;
    list.appendChild(li);
  });
  Sortable.create(list, {
    handle: ".move-trait",
    animation: 150,
    onEnd: function (evt) {
      const moved = appData.target.traits.splice(evt.oldIndex, 1)[0];
      appData.target.traits.splice(evt.newIndex, 0, moved);
      renderTraitsList();
    },
  });
}

document.getElementById("addTraitBtn").addEventListener("click", () => {
  const input = document.getElementById("newTraitInput");
  const val = input.value.trim();
  if (val && !appData.target.traits.includes(val)) {
    appData.target.traits.push(val);
    input.value = "";
    renderTraitsList();
  }
});

document.getElementById("traitsList").addEventListener("input", (e) => {
  if (e.target.classList.contains("trait-edit-input")) {
    const idx = e.target.getAttribute("data-idx");
    appData.target.traits[idx] = e.target.value;
  }
});

document.getElementById("traitsList").addEventListener("click", (e) => {
  if (e.target.closest(".remove-trait")) {
    const idx = e.target.closest("li").getAttribute("data-idx");
    appData.target.traits.splice(idx, 1);
    renderTraitsList();
  }
});

document
  .getElementById("targetHorseForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("targetName").value.trim();
    const size = document.getElementById("targetSize").value;
    // Get gender from radio
    const gender = document.querySelector(
      'input[name="targetGender"]:checked'
    ).value;
    // Get traits from all trait-edit-inputs
    const traits = Array.from(
      document.querySelectorAll("#traitsList .trait-edit-input")
    )
      .map((input) => input.value.trim())
      .filter((val) => val.length > 0);
    // Get body colors
    const bodyColors = {};
    document.querySelectorAll("#bodyColorsSettings select").forEach((sel) => {
      bodyColors[sel.getAttribute("data-body-part")] = sel.value;
    });
    appData.target = { name, size, gender, traits, bodyColors };
    // Update all breeding horses to have all traits
    for (const horse of appData.breeding) {
      for (const trait of traits) {
        if (!(trait in horse.traits)) horse.setTrait(trait, false);
      }
      for (const t in horse.traits) {
        if (!traits.includes(t)) delete horse.traits[t];
      }
    }
    await writeData(appData);
    settingsModal.hide();
    renderTable(true);
  });

window.addEventListener("DOMContentLoaded", loadApp);
