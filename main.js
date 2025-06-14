const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, 'horse-info.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for reading/writing JSON
ipcMain.handle('read-horse-info', async () => {
  try {
    return fs.readFileSync(DATA_FILE, 'utf-8');
  } catch (e) {
    return null;
  }
});
ipcMain.handle('write-horse-info', async (event, data) => {
  fs.writeFileSync(DATA_FILE, data, 'utf-8');
  return true;
});
