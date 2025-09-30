// Settings modal logic for Horse Breeding Planner
// This module handles the settings modal, traits editing, and body color settings

import createHorseSizeDropdown from "./horse/horseSizes.js";

let appDataRef;
let writeDataRef;
let renderTableRef;
let colorOptionsRef;
let REQUIRED_BODY_PARTS_REF;
let settingsModal;

function initSettings(
  appData,
  writeData,
  renderTable,
  colorOptions,
  REQUIRED_BODY_PARTS
) {
  // Inject the settings modal HTML if not present
  if (!document.getElementById("settingsModal")) {
    fetch("./assets/settings-modal.html")
      .then((res) => res.text())
      .then((html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        document.body.appendChild(temp.firstElementChild);
        // Now continue with modal setup
        setupSettings(
          appData,
          writeData,
          renderTable,
          colorOptions,
          REQUIRED_BODY_PARTS
        );
      });
  } else {
    setupSettings(
      appData,
      writeData,
      renderTable,
      colorOptions,
      REQUIRED_BODY_PARTS
    );
  }
}

function setupSettings(
  appData,
  writeData,
  renderTable,
  colorOptions,
  REQUIRED_BODY_PARTS
) {
  appDataRef = appData;
  writeDataRef = writeData;
  renderTableRef = renderTable;
  colorOptionsRef = colorOptions;
  REQUIRED_BODY_PARTS_REF = REQUIRED_BODY_PARTS;

  settingsModal = new bootstrap.Modal(document.getElementById("settingsModal"));
  // Replace static targetSize select with generated dropdown
  const oldSelect = document.getElementById("targetSize");
  if (oldSelect) {
    const newSelect = createHorseSizeDropdown({
      id: "targetSize",
      className: "form-select",
      required: true,
    });
    oldSelect.replaceWith(newSelect);
  }
  document
    .getElementById("settingsBtn")
    .addEventListener("click", showSettingsModal);
  document.getElementById("addTraitBtn").addEventListener("click", addTrait);
  document
    .getElementById("traitsList")
    .addEventListener("input", traitInputHandler);
  document
    .getElementById("traitsList")
    .addEventListener("click", removeTraitHandler);
  document
    .getElementById("targetHorseForm")
    .addEventListener("submit", submitSettingsForm);
}

function renderBodyColorsSettings() {
  const container = document.getElementById("bodyColorsSettings");
  container.innerHTML = "";
  const bodyColors = appDataRef.target.bodyColors || {};
  REQUIRED_BODY_PARTS_REF.forEach((part) => {
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
      bodyColors[part] &&
      colorOptionsRef.find((c) => c.name === bodyColors[part])
        ? colorOptionsRef.find((c) => c.name === bodyColors[part]).hex
        : "#fff";
    row.append(swatch);
    // Dropdown
    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    select.style.width = "200px";
    select.setAttribute("data-body-part", part);
    colorOptionsRef.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.name;
      o.textContent = `${opt.name} (${opt.hex})`;
      if (bodyColors[part] === opt.name) o.selected = true;
      o.setAttribute("data-hex", opt.hex);
      select.append(o);
    });
    select.addEventListener("change", function () {
      swatch.style.background =
        colorOptionsRef.find((c) => c.name === this.value)?.hex || "#fff";
    });
    row.append(select);
    container.append(row);
  });
}

function showSettingsModal() {
  const { target } = appDataRef;
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
  appDataRef.target.traits.forEach((trait, idx) => {
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
      const moved = appDataRef.target.traits.splice(evt.oldIndex, 1)[0];
      appDataRef.target.traits.splice(evt.newIndex, 0, moved);
      renderTraitsList();
    },
  });
}

function addTrait() {
  const input = document.getElementById("newTraitInput");
  const val = input.value.trim();
  if (val && !appDataRef.target.traits.includes(val)) {
    appDataRef.target.traits.push(val);
    input.value = "";
    renderTraitsList();
  }
}

function traitInputHandler(e) {
  if (e.target.classList.contains("trait-edit-input")) {
    const idx = e.target.getAttribute("data-idx");
    appDataRef.target.traits[idx] = e.target.value;
  }
}

function removeTraitHandler(e) {
  if (e.target.closest(".remove-trait")) {
    const idx = e.target.closest("li").getAttribute("data-idx");
    appDataRef.target.traits.splice(idx, 1);
    renderTraitsList();
  }
}

async function submitSettingsForm(e) {
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
  appDataRef.target = { name, size, gender, traits, bodyColors };
  // Update all breeding horses to have all traits
  for (const horse of appDataRef.breeding) {
    for (const trait of traits) {
      if (!(trait in horse.traits)) horse.setTrait(trait, false);
    }
    for (const t in horse.traits) {
      if (!traits.includes(t)) delete horse.traits[t];
    }
  }
  await writeDataRef(appDataRef);
  settingsModal.hide();
  renderTableRef(true);
}

export default initSettings;
