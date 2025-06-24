// scripts/horseSizes.js
// Centralized horse size dropdown for reuse

export const HORSE_SIZES = [
  "Draft",
  "Giant",
  "Huge",
  "Big",
  "Normal",
  "Little",
  "Small",
  "Tiny",
  "Teeny",
];

// Returns a new <select> element with all horse sizes as <option>s
function createHorseSizeDropdown({
  id = "",
  className = "form-select",
  required = true,
} = {}) {
  const select = document.createElement("select");
  if (id) select.id = id;
  if (className) select.className = className;
  if (required) select.required = true;
  for (const size of HORSE_SIZES) {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    select.appendChild(option);
  }
  return select;
}

export default createHorseSizeDropdown;
