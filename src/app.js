// Horse Breeding Planner App
// Data structure:
// {
//   target: { name, size, gender, traits: [trait1, trait2, ...] },
//   breeding: [ { name, size, gender, traits: {trait1: true/false, ...} }, ... ]
// }
import Horse from "./scripts/horse/horse.js";
import initSettings from "./scripts/settings.js";
import {
  initTargetTable,
  renderTable as renderTargetTable,
} from "./scripts/table/target-table.js";

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

let colorOptions = [];

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
  // Fetch color options if not already loaded
  if (window.horseAPI && window.horseAPI.getColors) {
    colorOptions = await window.horseAPI.getColors();
  }
  // Initialize table logic after appData and colorOptions are loaded
  initTargetTable(appData, writeData, colorOptions, REQUIRED_BODY_PARTS);
  renderTargetTable();
  // Initialize settings logic after appData and colorOptions are loaded
  initSettings(
    appData,
    writeData,
    renderTargetTable,
    colorOptions,
    REQUIRED_BODY_PARTS
  );
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

// Only call initTargetTable and renderTargetTable after loading data
window.addEventListener("DOMContentLoaded", loadApp);
