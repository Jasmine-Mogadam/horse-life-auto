const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const Jimp = require("jimp");

const DATA_FILE = path.join(__dirname, "data/horse-info.json");
const COLORS_FILE = path.join(__dirname, "./data/colors.csv");
const COLOR_COMBOS_FILE = path.join(__dirname, "data/color-combos.json");
const TRAITS_FILE = path.join(__dirname, "data/traits.json");

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
  win.loadFile(path.join(__dirname, "index.html"));
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

ipcMain.handle("take-screenshot", async () => {
  const displays = screen.getAllDisplays();
  let cropperWindows = [];

  // Create a window for each display
  for (const display of displays) {
    const cropperWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      transparent: true,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    // Pass display ID to the cropper window
    cropperWindow.loadFile(path.join(__dirname, "cropper.html"), {
      query: { displayId: display.id.toString() },
    });
    cropperWindows.push(cropperWindow);
  }

  return new Promise((resolve) => {
    ipcMain.once("crop-selection", async (event, { rect, displayId }) => {
      // Close all cropper windows
      for (const win of cropperWindows) {
        win.close();
      }
      cropperWindows = [];

      if (!rect) {
        resolve(null);
        return;
      }

      try {
        const numericDisplayId = parseInt(displayId, 10);
        const display = displays.find((d) => d.id == numericDisplayId);

        if (!display) {
          console.error("Could not find display with ID:", displayId);
          resolve(null);
          return;
        }

        const sources = await desktopCapturer.getSources({
          types: ["screen"],
          thumbnailSize: {
            width: display.size.width * display.scaleFactor,
            height: display.size.height * display.scaleFactor,
          },
        });

        const displaySource = sources.find(
          (s) => s.display_id == numericDisplayId
        );

        if (!displaySource) {
          console.error("Could not find source for display ID:", displayId);
          resolve(null);
          return;
        }

        const fullImage = displaySource.thumbnail;

        // Adjust rect for display scaling
        const scaledRect = {
          x: rect.x * display.scaleFactor,
          y: rect.y * display.scaleFactor,
          width: rect.width * display.scaleFactor,
          height: rect.height * display.scaleFactor,
        };

        const croppedImage = fullImage.crop(scaledRect);

        const buffer = croppedImage.toPNG();
        Jimp.read(buffer)
          .then((image) => {
            image
              .greyscale()
              .contrast(1)
              .threshold({ max: 128 })
              .getBuffer(Jimp.MIME_PNG, (err, processedBuffer) => {
                if (err) {
                  console.error("Image processing failed:", err);
                  resolve(null);
                  return;
                }
                const tempPath = path.join(
                  app.getPath("temp"),
                  "screenshot.png"
                );
                fs.writeFileSync(tempPath, processedBuffer);
                resolve(tempPath);
              });
          })
          .catch((err) => {
            console.error("Image processing failed:", err);
            resolve(null);
          });
      } catch (error) {
        console.error("Failed to capture screen:", error);
        resolve(null);
      }
    });
  });
});

ipcMain.handle("get-traits", async () => {
  try {
    const data = fs.readFileSync(TRAITS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
});
