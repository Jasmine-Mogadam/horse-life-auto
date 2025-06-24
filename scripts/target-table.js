// target-table.js
// Handles rendering and logic for the breeding horses table

import createHorseSizeDropdown from "./horseSizes.js";

let appDataRef;
let writeDataRef;
let colorOptionsRef;
let REQUIRED_BODY_PARTS_REF;

let tableColumnsHtml = "";
let lastTraits = [];

export function initTargetTable(
  appData,
  writeData,
  colorOptions,
  REQUIRED_BODY_PARTS
) {
  appDataRef = appData;
  writeDataRef = writeData;
  colorOptionsRef = colorOptions;
  REQUIRED_BODY_PARTS_REF = REQUIRED_BODY_PARTS;

  document.getElementById("addHorseBtn").addEventListener("click", onAddHorse);
  document
    .getElementById("horseTableContainer")
    .addEventListener("input", onTableInput);
  document
    .getElementById("horseTableContainer")
    .addEventListener("change", onTableChange);
  document
    .getElementById("horseTableContainer")
    .addEventListener("click", onTableClick);
}

export function renderTable(forceRebuildColumns = false) {
  renderMissingTraits();
  const container = document.getElementById("horseTableContainer");
  const { target, breeding } = appDataRef;
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
  setTableScrollDivWidth(scrollDiv);
  // Create table
  const table = document.createElement("table");
  table.className = "table table-bordered align-middle";

  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = tableColumnsHtml;
  thead.append(headerRow);
  table.append(thead);
  // Body
  const tbody = document.createElement("tbody");
  tbody.id = "breedingTableBody";
  breeding.forEach((horse, idx) => {
    // Calculate match percent
    let match = 0;
    let total = target.traits.length + 2 + REQUIRED_BODY_PARTS_REF.length;
    for (const trait of target.traits) {
      if (horse.traits[trait]) match++;
    }
    if (horse.size === target.size) match++;
    if (horse.gender === target.gender) match++;
    // Count body color matches
    REQUIRED_BODY_PARTS_REF.forEach((part) => {
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
    tdDrag.className = "draggable drag-cell text-center";
    tdDrag.innerHTML = '<i class="fa fa-bars"></i>';
    tr.append(tdDrag);
    // Name
    const tdName = document.createElement("td");
    tdName.className = "name-cell";
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
    tdSize.className = "size-cell";
    tdSize.classList.toggle("size-match", horse.size === target.size);
    const sizeSelect = createHorseSizeDropdown({
      className: "form-select form-select-sm",
      required: true,
    });
    sizeSelect.setAttribute("data-field", "size");
    sizeSelect.setAttribute("data-idx", idx);
    sizeSelect.value = horse.size;
    tdSize.append(sizeSelect);
    tr.append(tdSize);
    // Gender
    const tdGender = document.createElement("td");
    tdGender.classList.toggle("gender-match", horse.gender === target.gender);
    tdGender.classList.add("gender-cell");
    const genderFlex = document.createElement("div");
    genderFlex.className = "gender-flex";
    const genderSelect = document.createElement("select");
    genderSelect.className =
      "form-select form-select-sm gender-select no-dropdown-arrow";
    genderSelect.setAttribute("data-field", "gender");
    genderSelect.setAttribute("data-idx", idx);
    [
      { value: "Female", label: "\u2640", color: "#ffb6d5" },
      { value: "Male", label: "\u2642", color: "#8ecaff" },
    ].forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if (horse.gender === opt.value) o.selected = true;
      o.setAttribute("data-color", opt.color);
      genderSelect.append(o);
    });
    genderSelect.classList.remove("gender-select-female", "gender-select-male");
    if (horse.gender === "Female") {
      genderSelect.classList.add("gender-select-female");
    } else if (horse.gender === "Male") {
      genderSelect.classList.add("gender-select-male");
    }
    genderSelect.addEventListener("change", function () {
      this.classList.remove("gender-select-female", "gender-select-male");
      if (this.value === "Female") {
        this.classList.add("gender-select-female");
      } else if (this.value === "Male") {
        this.classList.add("gender-select-male");
      }
    });
    genderFlex.append(genderSelect);
    tdGender.append(genderFlex);
    tr.append(tdGender);
    // Traits
    for (const trait of target.traits) {
      const tdTrait = document.createElement("td");
      tdTrait.classList.toggle("trait-match", horse.traits[trait] === true);
      tdTrait.classList.add("trait-cell");
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
    REQUIRED_BODY_PARTS_REF.forEach((part) => {
      const td = document.createElement("td");
      const match =
        (horse.bodyColors[part] || "") === (target.bodyColors?.[part] || "");
      td.classList.toggle("bodycolor-match", match);
      td.classList.add("bodycolor-cell");
      const colorCol = document.createElement("div");
      colorCol.className = "color-col";
      // Remove all inline width/height, rely on CSS
      // Set swatch background color via CSS variable
      const swatchBtn = document.createElement("button");
      swatchBtn.type = "button";
      swatchBtn.className = "color-swatch";
      swatchBtn.style.setProperty(
        "--swatch-bg",
        colorOptionsRef.find((c) => c.name === horse.bodyColors[part])?.hex ||
          "#fff"
      );
      swatchBtn.style.border = "1px solid #ccc";
      swatchBtn.style.padding = "0";
      swatchBtn.style.margin = "0";
      swatchBtn.style.cursor = "pointer";
      swatchBtn.style.borderRadius = "4px";
      swatchBtn.style.position = "relative";
      const select = document.createElement("select");
      select.className =
        "form-select form-select-sm d-inline-block color-dropdown";
      select.classList.add("color-dropdown-absolute");
      select.style.position = "absolute";
      select.style.left = "0";
      select.style.top = "0";
      select.style.zIndex = "10";
      select.style.opacity = "0";
      select.style.pointerEvents = "none";
      select.setAttribute("data-body-part", part);
      select.setAttribute("data-idx", idx);
      const sortedColors = [...colorOptionsRef].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      sortedColors.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.name;
        o.textContent = opt.name;
        if (horse.bodyColors[part] === opt.name) o.selected = true;
        o.setAttribute("data-hex", opt.hex);
        select.append(o);
      });
      swatchBtn.addEventListener("click", function (e) {
        select.style.opacity = "1";
        select.style.pointerEvents = "auto";
        select.focus();
        swatchBtn.style.outline = "2px solid #888";
      });
      select.addEventListener("blur", function () {
        select.style.opacity = "0";
        select.style.pointerEvents = "none";
        swatchBtn.style.outline = "none";
      });
      select.addEventListener("change", async function () {
        horse.bodyColors[part] = this.value;
        swatchBtn.style.background =
          colorOptionsRef.find((c) => c.name === this.value)?.hex || "#fff";
        select.style.opacity = "0";
        select.style.pointerEvents = "none";
        swatchBtn.style.outline = "none";
        await writeDataRef(appDataRef);
        renderTable();
      });
      swatchBtn.style.position = "relative";
      select.style.left = "0";
      select.style.top = "0";
      select.style.margin = "0";
      select.style.transform = "translateY(-2px)";
      colorCol.append(swatchBtn);
      colorCol.append(select);
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
    tdDel.className = "delete-cell text-center";
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

function buildTableColumns(target) {
  const fragment = document.createDocumentFragment();

  const thMatch = document.createElement("th");
  thMatch.className = "match-header";
  thMatch.textContent = "% Match";
  fragment.appendChild(thMatch);

  const thDrag = document.createElement("th");
  thDrag.className = "drag-header";
  fragment.appendChild(thDrag);

  const thName = document.createElement("th");
  thName.className = "name-header";
  thName.textContent = "Name";
  fragment.appendChild(thName);

  const thSize = document.createElement("th");
  thSize.className = "size-header";
  thSize.textContent = "Size";
  fragment.appendChild(thSize);

  const thGender = document.createElement("th");
  thGender.className = "gender-header";
  thGender.textContent = "Gender";
  fragment.appendChild(thGender);

  for (const trait of target.traits) {
    const thTrait = document.createElement("th");
    thTrait.className = "trait-header";
    thTrait.textContent = trait;
    fragment.appendChild(thTrait);
  }
  for (const part of REQUIRED_BODY_PARTS_REF) {
    const thPart = document.createElement("th");
    thPart.className = "trait-header";
    const partDiv = document.createElement("div");
    partDiv.className = "body-part-header";
    const spanPart = document.createElement("span");
    spanPart.textContent = part;
    partDiv.appendChild(spanPart);
    const colorName = target.bodyColors?.[part] || "";
    const colorObj = colorOptionsRef.find((c) => c.name === colorName);
    const colorHex = colorObj ? colorObj.hex : "#fff";
    const colorRow = document.createElement("span");
    colorRow.className = "body-part-color-row";
    const colorSwatch = document.createElement("span");
    colorSwatch.className = "color-swatch";
    colorSwatch.style.setProperty("--swatch-bg", colorHex);
    colorRow.appendChild(colorSwatch);
    const colorLabel = document.createElement("span");
    colorLabel.className = "body-part-color-label";
    colorLabel.textContent = colorName;
    colorRow.appendChild(colorLabel);
    partDiv.appendChild(colorRow);
    thPart.appendChild(partDiv);
    fragment.appendChild(thPart);
  }
  const thDel = document.createElement("th");
  thDel.className = "delete-header";
  fragment.appendChild(thDel);

  // Convert fragment to HTML string for legacy compatibility
  const temp = document.createElement("tr");
  temp.appendChild(fragment);
  return temp.innerHTML;
}

function setTableScrollDivWidth(scrollDiv) {
  scrollDiv.style.width = "";
}

function makeTableDraggable() {
  const tbody = document.getElementById("breedingTableBody");
  if (!tbody) return;
  Sortable.create(tbody, {
    handle: ".draggable",
    animation: 150,
    onEnd: async function (evt) {
      const moved = appDataRef.breeding.splice(evt.oldIndex, 1)[0];
      appDataRef.breeding.splice(evt.newIndex, 0, moved);
      await writeDataRef(appDataRef);
      renderTable();
    },
  });
}

function renderMissingTraits() {
  const container = document.getElementById("missingTraitsContainer");
  const { target, breeding } = appDataRef;
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

async function onAddHorse() {
  const { target } = appDataRef;
  const newHorse = new (await import("./horse.js")).default({
    name: "New Horse",
    size: target.size,
    gender: target.gender,
    traits: target.traits,
  });
  appDataRef.breeding.push(newHorse);
  await writeDataRef(appDataRef);
  renderTable();
}

async function onTableInput(e) {
  const idx = e.target.getAttribute("data-idx");
  const field = e.target.getAttribute("data-field");
  if (idx !== null && field) {
    const horse = appDataRef.breeding[idx];
    if (field === "name" || field === "size") {
      horse[field] = e.target.value;
    } else if (field === "gender") {
      horse[field] = e.target.value;
    }
    await writeDataRef(appDataRef);
    // Only re-render if not editing a text input (to avoid cursor jump)
    if (field !== "name") {
      renderTable();
    }
  }
}

async function onTableChange(e) {
  const idx = e.target.getAttribute("data-idx");
  const field = e.target.getAttribute("data-field");
  if (idx !== null && field === "trait") {
    const trait = e.target.getAttribute("data-trait");
    const horse = appDataRef.breeding[idx];
    horse.setTrait(trait, e.target.checked);
    await writeDataRef(appDataRef);
    renderTable();
  }
}

async function onTableClick(e) {
  if (e.target.closest(".delete-horse")) {
    const idx = e.target.closest(".delete-horse").getAttribute("data-idx");
    appDataRef.breeding.splice(idx, 1);
    await writeDataRef(appDataRef);
    renderTable();
  }
}
