// Horse Breeding Planner App
// Data structure:
// {
//   target: { name, size, gender, traits: [trait1, trait2, ...] },
//   breeding: [ { name, size, gender, traits: {trait1: true/false, ...} }, ... ]
// }

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
  html += '<th style="width:80px">% Match</th>';
  html += '<th style="width:120px"></th>'; // drag handle
  html += '<th style="width:160px">Name</th>';
  html += '<th style="width:120px">Size</th>';
  html += '<th style="width:120px">Gender</th>';
  for (const trait of target.traits) {
    html += `<th class="trait-header" style="width:120px">${trait}</th>`;
  }
  html += '<th style="width:80px"></th>'; // delete btn
  return html;
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
  container.innerHTML = '';
  // Create scrollable div
  const scrollDiv = document.createElement('div');
  scrollDiv.style.overflowX = 'auto';
  // Create table
  const table = document.createElement('table');
  table.className = 'table table-bordered align-middle';
  table.style.minWidth = '1200px';
  table.style.tableLayout = 'fixed';
  table.style.width = '100%';
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  // Columns
  headerRow.innerHTML = tableColumnsHtml;
  thead.append(headerRow);
  table.append(thead);
  // Body
  const tbody = document.createElement('tbody');
  tbody.id = 'breedingTableBody';
  breeding.forEach((horse, idx) => {
    // Calculate match percent
    let match = 0, total = target.traits.length;
    for (const trait of target.traits) {
      if (horse.traits[trait]) match++;
    }
    if (horse.size === target.size) match++;
    if (horse.gender === target.gender) match++;
    let percent = total > 0 ? (100 * match) / (total + 2) : 0;
    // Color for percent cell
    const bgColor = `background: linear-gradient(90deg, #fff ${100 - percent}%, #b6fcb6 ${percent}%);`;
    const tr = document.createElement('tr');
    tr.className = 'horse-row';
    tr.setAttribute('data-idx', idx);
    // % Match
    const tdPercent = document.createElement('td');
    tdPercent.style = bgColor;
    tdPercent.innerHTML = `<b>${percent.toFixed(2)}%</b>`;
    tr.append(tdPercent);
    // Drag handle
    const tdDrag = document.createElement('td');
    tdDrag.className = 'draggable';
    tdDrag.innerHTML = '<i class="fa fa-bars"></i>';
    tr.append(tdDrag);
    // Name
    const tdName = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'form-control form-control-sm';
    nameInput.value = horse.name;
    nameInput.setAttribute('data-field', 'name');
    nameInput.setAttribute('data-idx', idx);
    tdName.append(nameInput);
    tr.append(tdName);
    // Size
    const tdSize = document.createElement('td');
    let sizeMatch = horse.size === target.size;
    tdSize.style = sizeMatch ? 'background-color:#b6fcb6' : '';
    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'form-select form-select-sm';
    sizeSelect.setAttribute('data-field', 'size');
    sizeSelect.setAttribute('data-idx', idx);
    ["Big","Draft","Giant","Huge","Little","Normal","Small","Teeny"].forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (horse.size === opt) o.selected = true;
      sizeSelect.append(o);
    });
    tdSize.append(sizeSelect);
    tr.append(tdSize);
    // Gender
    const tdGender = document.createElement('td');
    let genderMatch = horse.gender === target.gender;
    tdGender.style = genderMatch ? 'background-color:#b6fcb6' : '';
    const genderSelect = document.createElement('select');
    genderSelect.className = 'form-select form-select-sm';
    genderSelect.setAttribute('data-field', 'gender');
    genderSelect.setAttribute('data-idx', idx);
    ["Female","Male"].forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (horse.gender === opt) o.selected = true;
      genderSelect.append(o);
    });
    tdGender.append(genderSelect);
    tr.append(tdGender);
    // Traits
    for (const trait of target.traits) {
      const tdTrait = document.createElement('td');
      let isMatch = horse.traits[trait] === true;
      tdTrait.style = isMatch ? 'background-color:#b6fcb6' : '';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.setAttribute('data-field', 'trait');
      cb.setAttribute('data-trait', trait);
      cb.setAttribute('data-idx', idx);
      if (isMatch) cb.checked = true;
      tdTrait.append(cb);
      tr.append(tdTrait);
    }
    // Delete
    const tdDel = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm delete-horse';
    delBtn.setAttribute('data-idx', idx);
    delBtn.innerHTML = '<i class="fa fa-trash"></i>';
    tdDel.append(delBtn);
    tr.append(tdDel);
    tbody.append(tr);
  });
  table.append(tbody);
  scrollDiv.append(table);
  container.innerHTML = '';
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
  const newHorse = {
    name: "New Horse",
    size: target.size,
    gender: target.gender,
    traits: Object.fromEntries(target.traits.map((t) => [t, false])),
  };
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
      if (field === "name" || field === "size") {
        appData.breeding[idx][field] = e.target.value;
      } else if (field === "gender") {
        appData.breeding[idx][field] = e.target.value;
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
      appData.breeding[idx].traits[trait] = e.target.checked;
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
    appData.target = { name, size, gender, traits };
    // Update all breeding horses to have all traits
    for (const horse of appData.breeding) {
      for (const trait of traits) {
        if (!(trait in horse.traits)) horse.traits[trait] = false;
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
