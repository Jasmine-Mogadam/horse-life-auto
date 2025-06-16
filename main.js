const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const DATA_FILE = path.join(__dirname, "horse-info.json");
const COLORS_FILE = path.join(__dirname, "colors.csv");
const COLOR_COMBOS_FILE = path.join(__dirname, "color-combos.json");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Ensure color-combos.json exists on startup
if (!fs.existsSync(COLOR_COMBOS_FILE)) {
  fs.writeFileSync(COLOR_COMBOS_FILE, "[]", "utf-8");
}

// IPC handlers for reading/writing JSON
ipcMain.handle("read-horse-info", async () => {
  try {
    return fs.readFileSync(DATA_FILE, "utf-8");
  } catch (e) {
    return null;
  }
});
ipcMain.handle("write-horse-info", async (event, data) => {
  fs.writeFileSync(DATA_FILE, data, "utf-8");
  return true;
});

// IPC handlers for reading/writing color combos
ipcMain.handle("read-color-combos", async () => {
  try {
    return fs.readFileSync(COLOR_COMBOS_FILE, "utf-8");
  } catch (e) {
    return null;
  }
});
ipcMain.handle("write-color-combos", async (event, data) => {
  fs.writeFileSync(COLOR_COMBOS_FILE, data, "utf-8");
  return true;
});

function parseColorsCSV() {
  try {
    const csv = fs.readFileSync(COLORS_FILE, "utf-8");
    const colors = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"))
      .map((line) => {
        // Format: "#HEX (r, g, b)",Name
        const match = line.match(/^"?(#[0-9A-Fa-f]{6})[^"\n]*"?,(.+)$/);
        if (match) {
          return { hex: match[1], name: match[2].trim() };
        }
        return null;
      })
      .filter(Boolean);
    // Sort alphabetically by name
    colors.sort((a, b) => a.name.localeCompare(b.name));
    return colors;
  } catch (e) {
    return [];
  }
}

ipcMain.handle("get-colors", async () => {
  return parseColorsCSV();
});
