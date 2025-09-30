// main.js (Main Process)
const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const Tesseract = require("tesseract.js");

let mainWindow;

async function initializeOCR() {
  // Initialize Tesseract worker
  await Tesseract.createEngine({
    logger: (m) => console.log(m),
  });
}
initializeOCR();

async function captureAndExtractText() {
  try {
    // Get available sources (windows/screens)
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    // Show selection dialog
    const { response } = await electron.dialog.showOpenDialog(mainWindow, {
      title: "Select Region",
      properties: ["openFile"],
    });

    if (!response || response.length === 0) {
      throw new Error("No region selected");
    }

    // Capture selected region
    const source = sources[0]; // Use first screen
    const screenshot = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: source.width, height: source.height },
    });

    // Extract text using Tesseract
    const result = await Tesseract.recognize(
      screenshot[0].thumbnail.toDataURL(),
      "eng",
      {
        logger: (m) => console.log(m),
        langPath: path.join(__dirname, "tessdata"),
      }
    );

    return result.data.text;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Handle requests from renderer
ipcMain.handle("capture-and-extract", async () => {
  return await captureAndExtractText();
});

// renderer.js
const { ipcRenderer } = require("electron");

async function captureAndExtractText() {
  try {
    const extractedText = await ipcRenderer.invoke("capture-and-extract");
    console.log("Extracted text:", extractedText);
    return extractedText;
  } catch (error) {
    console.error("Error extracting text:", error);
    throw error;
  }
}

// Example usage in your UI
document
  .getElementById("capture-button")
  .addEventListener("click", async () => {
    const extractedText = await captureAndExtractText();
    document.getElementById("result-textarea").value = extractedText;
  });
