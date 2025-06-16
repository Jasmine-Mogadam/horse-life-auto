// Color Prediction Tab Logic
// UI: Color combo enterer (collapsible), and color combination tree ("wip")

const COLOR_COMBOS_FILE = "color-combos.json";

// Utility: Read/write color combos (localStorage fallback)
async function readColorCombos() {
  if (window.horseAPI && window.horseAPI.readColorCombos) {
    // Use Electron IPC handler for color-combos.json
    const data = await window.horseAPI.readColorCombos();
    return data ? JSON.parse(data) : [];
  } else if (window.electronAPI && window.electronAPI.invoke) {
    // Fallback for some Electron setups
    const data = await window.electronAPI.invoke("read-color-combos");
    return data ? JSON.parse(data) : [];
  } else if (window.api && window.api.invoke) {
    // Fallback for some Electron setups
    const data = await window.api.invoke("read-color-combos");
    return data ? JSON.parse(data) : [];
  } else {
    const data = localStorage.getItem(COLOR_COMBOS_FILE);
    return data ? JSON.parse(data) : [];
  }
}
async function writeColorCombos(combos) {
  if (window.horseAPI && window.horseAPI.writeColorCombos) {
    // Use Electron IPC handler for color-combos.json
    await window.horseAPI.writeColorCombos(JSON.stringify(combos, null, 2));
  } else if (window.electronAPI && window.electronAPI.invoke) {
    await window.electronAPI.invoke(
      "write-color-combos",
      JSON.stringify(combos, null, 2)
    );
  } else if (window.api && window.api.invoke) {
    await window.api.invoke(
      "write-color-combos",
      JSON.stringify(combos, null, 2)
    );
  } else {
    localStorage.setItem(COLOR_COMBOS_FILE, JSON.stringify(combos));
  }
}

// Try to get colorOptions from window or fallback
let colorOptions = [];

// Fetch color options at startup (same as app.js)
(async function fetchColors() {
  if (window.horseAPI && window.horseAPI.getColors) {
    colorOptions = await window.horseAPI.getColors();
    if (Array.isArray(colorOptions)) {
      colorOptions.sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  // If color prediction tab is visible, re-render to update dropdowns
  if (
    document.getElementById("colorPredictTabPane").classList.contains("active")
  ) {
    renderColorComboEnterer();
    renderColorComboTree();
  }
})();

function renderColorComboEnterer() {
  const container = document.getElementById("colorComboEntererContainer");
  container.innerHTML = `
    <div class="card">
      <div class="card-header p-2 d-flex align-items-center justify-content-between" style="cursor:pointer;" id="colorComboEntererHeader">
        <span><i class="fa fa-flask me-2"></i>Enter Color Combination</span>
        <span class="collapse-arrow"><i class="fa fa-chevron-down"></i></span>
      </div>
      <div class="collapse show" id="colorComboEntererCollapse">
        <div class="card-body p-3">
          <form id="colorComboForm" autocomplete="off">
            <div class="row mb-2">
              <div class="col">
                <label class="form-label">Parent Color 1</label>
                <select class="form-select form-select-sm" id="parentColor1" required>
                  <option value="" disabled selected>Select color</option>
                  ${
                    colorOptions.length
                      ? colorOptions
                          .map(
                            (c) =>
                              `<option value="${c.name}">${c.name}</option>`
                          )
                          .join("")
                      : '<option value="">No colors</option>'
                  }
                </select>
              </div>
              <div class="col">
                <label class="form-label">Parent Color 2</label>
                <select class="form-select form-select-sm" id="parentColor2" required>
                  <option value="" disabled selected>Select color</option>
                  ${
                    colorOptions.length
                      ? colorOptions
                          .map(
                            (c) =>
                              `<option value="${c.name}">${c.name}</option>`
                          )
                          .join("")
                      : '<option value="">No colors</option>'
                  }
                </select>
              </div>
            </div>
            <div class="mb-2">
              <label class="form-label">Possible Resulting Colors (drag to reorder)</label>
              <ul class="list-group" id="resultColorsList"></ul>
              <div class="input-group mt-2">
                <select class="form-select form-select-sm" id="newResultColorSelect">
                  <option value="" disabled selected>Add result color</option>
                  ${
                    colorOptions.length
                      ? colorOptions
                          .map(
                            (c) =>
                              `<option value="${c.name}">${c.name}</option>`
                          )
                          .join("")
                      : '<option value="">No colors</option>'
                  }
                </select>
                <button class="btn btn-outline-secondary btn-sm" type="button" id="addResultColorBtn">Add</button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm mt-2">Save Combination</button>
          </form>
        </div>
      </div>
    </div>
  `;
  // Collapse logic
  const header = document.getElementById("colorComboEntererHeader");
  const collapse = document.getElementById("colorComboEntererCollapse");
  header.addEventListener("click", () => {
    collapse.classList.toggle("show");
    header.querySelector(".collapse-arrow i").className =
      collapse.classList.contains("show")
        ? "fa fa-chevron-down"
        : "fa fa-chevron-right";
  });
  // Result color list logic
  let resultColors = [];
  function renderResultColorsList() {
    const list = document.getElementById("resultColorsList");
    list.innerHTML = "";
    resultColors.forEach((color, idx) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex align-items-center";
      li.setAttribute("data-idx", idx);
      // Dropdown for editing result color
      const select = document.createElement("select");
      select.className =
        "form-select form-select-sm flex-grow-1 result-color-edit-select";
      select.setAttribute("data-idx", idx);
      colorOptions.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.name;
        o.textContent = opt.name;
        if (color === opt.name) o.selected = true;
        select.append(o);
      });
      select.addEventListener("change", (e) => {
        resultColors[idx] = e.target.value;
      });
      li.appendChild(select);
      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.className =
        "btn btn-sm btn-outline-danger ms-2 remove-result-color";
      removeBtn.innerHTML = '<i class="fa fa-trash"></i>';
      li.appendChild(removeBtn);
      // Drag handle
      const dragSpan = document.createElement("span");
      dragSpan.className = "ms-2 move-result-color";
      dragSpan.style.cursor = "grab";
      dragSpan.innerHTML = '<i class="fa fa-bars"></i>';
      li.appendChild(dragSpan);
      list.appendChild(li);
    });
    if (window.Sortable) {
      Sortable.create(list, {
        handle: ".move-result-color",
        animation: 150,
        onEnd: function (evt) {
          const moved = resultColors.splice(evt.oldIndex, 1)[0];
          resultColors.splice(evt.newIndex, 0, moved);
          renderResultColorsList();
        },
      });
    }
  }
  document.getElementById("addResultColorBtn").addEventListener("click", () => {
    const select = document.getElementById("newResultColorSelect");
    const val = select.value;
    if (val && !resultColors.includes(val)) {
      resultColors.push(val);
      select.selectedIndex = 0;
      renderResultColorsList();
    }
  });
  document.getElementById("resultColorsList").addEventListener("click", (e) => {
    if (e.target.closest(".remove-result-color")) {
      const idx = e.target.closest("li").getAttribute("data-idx");
      resultColors.splice(idx, 1);
      renderResultColorsList();
    }
  });
  // Form submit
  document
    .getElementById("colorComboForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const parent1 = document.getElementById("parentColor1").value.trim();
      const parent2 = document.getElementById("parentColor2").value.trim();
      if (!parent1 || !parent2 || resultColors.length === 0) return;
      let combos = await readColorCombos();
      // Remove existing combo for these parents (order-insensitive)
      combos = combos.filter(
        (c) =>
          !(
            (c.parent1 === parent1 && c.parent2 === parent2) ||
            (c.parent1 === parent2 && c.parent2 === parent1)
          )
      );
      // Ensure both parent colors are in the results
      let results = [...resultColors];
      if (!results.includes(parent1)) results.push(parent1);
      if (!results.includes(parent2)) results.push(parent2);
      combos.push({ parent1, parent2, results });
      await writeColorCombos(combos); // Ensure this completes before UI update
      document.getElementById("colorComboForm").reset();
      resultColors = [];
      renderResultColorsList();
      // No alert, just update UI
      renderColorComboTree();
    });
  renderResultColorsList();
}

// --- Color Combo Tree (Ancestry) ---
let d3Loaded = false;

function loadD3IfNeeded(cb) {
  if (d3Loaded) return cb();
  if (window.d3) {
    d3Loaded = true;
    return cb();
  }
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js";
  script.onload = () => {
    d3Loaded = true;
    cb();
  };
  document.head.appendChild(script);
}

function renderColorComboTree() {
  const container = document.getElementById("colorComboTreeContainer");
  // Set up flex layout for the tab content
  const tabPane = document.getElementById("colorPredictTabPane");
  tabPane.style.display = "flex";
  tabPane.style.flexDirection = "column";
  tabPane.style.height = "calc(100vh - 160px)"; // adjust as needed for header/nav

  // Make combo enterer container not grow
  const comboEnterer = document.getElementById("colorComboEntererContainer");
  if (comboEnterer) {
    comboEnterer.style.flex = "0 0 auto";
    comboEnterer.style.marginBottom = "8px";
  }
  // Make tree container fill remaining space
  container.style.flex = "1 1 0%";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.minHeight = 0;
  container.innerHTML = `<div class="mb-2">
    <label class="form-label">Select Color to Trace:</label>
    <select class="form-select form-select-sm" id="treeColorSelect" style="max-width:300px;display:inline-block;"></select>
  </div>
  <div id="colorTreeD3" style="flex:1 1 0%; min-height:0; width:100%; height:100%; overflow:visible; white-space:normal;"></div>`;

  // Populate dropdown
  const select = container.querySelector("#treeColorSelect");
  colorOptions.forEach((c) => {
    const o = document.createElement("option");
    o.value = c.name;
    o.textContent = c.name;
    select.append(o);
  });
  select.addEventListener("change", () => {
    renderTreeForColor(select.value);
  });
  // Default to first color
  if (colorOptions.length) {
    select.value = colorOptions[0].name;
    renderTreeForColor(select.value);
  }

  // Resize observer to redraw tree on container resize
  const treeDiv = container.querySelector("#colorTreeD3");
  if (window._colorTreeResizeObs) window._colorTreeResizeObs.disconnect();
  window._colorTreeResizeObs = new ResizeObserver(() => {
    const selected = select.value;
    if (selected) renderTreeForColor(selected);
  });
  window._colorTreeResizeObs.observe(treeDiv);
}

async function renderTreeForColor(colorName) {
  // Load combos
  const combos = await readColorCombos();
  // Build ancestry tree data
  const treeData = buildColorAncestryTree(
    colorName,
    combos,
    0,
    new Set(),
    new Set()
  );
  // Render with D3
  loadD3IfNeeded(() => renderD3Tree(treeData));
}

// Recursively build ancestry tree for a color
function buildColorAncestryTree(color, combos, depth, seen, seenCombos) {
  if (seen.has(color) || depth > 10) return { name: color, children: [] };
  seen.add(color);
  if (!seenCombos) seenCombos = new Set();
  // Find all combos that produce this color
  const parentCombos = combos.filter((c) => c.results.includes(color));
  if (!parentCombos.length) return { name: color, children: [] };
  // Each combo is a parent node with two children (the parents)
  return {
    name: color,
    children: parentCombos.map((combo) => {
      // Unique key for this parent combo (order-insensitive)
      const comboKey = [combo.parent1, combo.parent2].sort().join("+");
      if (seenCombos.has(comboKey)) {
        // Already shown this parent combo in this ancestry path
        return {
          name: `${combo.parent1} + ${combo.parent2}`,
          children: [],
        };
      }
      // Mark this combo as seen for this ancestry path
      const newSeenCombos = new Set(seenCombos);
      newSeenCombos.add(comboKey);
      return {
        name: `${combo.parent1} + ${combo.parent2}`,
        children: [
          buildColorAncestryTree(
            combo.parent1,
            combos,
            depth + 1,
            new Set(seen),
            newSeenCombos
          ),
          buildColorAncestryTree(
            combo.parent2,
            combos,
            depth + 1,
            new Set(seen),
            newSeenCombos
          ),
        ],
      };
    }),
  };
}

function renderD3Tree(treeData) {
  const container = document.getElementById("colorTreeD3");
  container.innerHTML = "";
  // Vertical tree: height is based on depth, width on number of leaves
  function getDepth(node) {
    if (!node.children || node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(getDepth));
  }
  function getLeafCount(node) {
    if (!node.children || node.children.length === 0) return 1;
    return node.children.reduce((sum, c) => sum + getLeafCount(c), 0);
  }
  const maxDepth = getDepth(treeData);
  const leafCount = getLeafCount(treeData);
  const dx = 48,
    dy = 220;
  const height = Math.max(900, maxDepth * dx + 200);
  const width = Math.max(400, leafCount * dy + 80);
  const tree = d3.tree().nodeSize([dy, dx]); // swap dx/dy for vertical
  const diagonal = d3
    .linkVertical()
    .x((d) => d.x)
    .y((d) => d.y);
  const root = d3.hierarchy(treeData);
  root.x0 = 0;
  root.y0 = 0;
  tree(root);
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  root.each((d) => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
    if (d.y > y1) y1 = d.y;
    if (d.y < y0) y0 = d.y;
  });
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [x0 - 40, y0 - 40, width, height])
    .style("font", "13px sans-serif")
    .style("user-select", "none")
    .style("overflow", "visible");
  const g = svg.append("g").attr("transform", `translate(40,40)`);
  // Links
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", diagonal);
  // Nodes
  const node = g
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);
  node
    .append("circle")
    .attr("fill", (d) => {
      // If the node is a color (not a combo), use its hex
      const colorObj = colorOptions.find(c => c.name === d.data.name);
      if (colorObj) return colorObj.hex;
      return d.children ? "#b6fcb6" : "#fff";
    })
    .attr("stroke", (d) => (d.children ? "#4caf50" : "#aaa"))
    .attr("r", 10);
  node
    .append("text")
    .attr("dy", "0.32em")
    .attr("y", (d) => (d.children ? -16 : 16))
    .attr("text-anchor", "middle")
    .text((d) => d.data.name)
    .style("font-weight", (d) => (d.depth === 0 ? "bold" : "normal"));
  container.appendChild(svg.node());
}

// Only render when tab is shown
function setupColorPredictTab() {
  const colorTab = document.getElementById("colorpredict-tab");
  colorTab.addEventListener("shown.bs.tab", () => {
    renderColorComboEnterer();
    renderColorComboTree();
  });
}

// If already on color tab, render immediately
if (
  document.getElementById("colorPredictTabPane").classList.contains("active")
) {
  renderColorComboEnterer();
  renderColorComboTree();
}
setupColorPredictTab();
