const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

let electronProcess = null;

const electronPath = process.platform === 'win32'
  ? path.join(__dirname, 'node_modules', '.bin', 'electron.cmd')
  : path.join(__dirname, 'node_modules', '.bin', 'electron');

function startElectron() {
  if (electronProcess) {
    // Ensure the process is killed and wait for it to exit before starting a new one
    const oldProcess = electronProcess;
    electronProcess = null;
    oldProcess.once('exit', () => {
      actuallyStartElectron();
    });
    oldProcess.kill();
  } else {
    actuallyStartElectron();
  }
}

function actuallyStartElectron() {
  electronProcess = spawn(
    electronPath,
    ['.'],
    { stdio: 'inherit' }
  );
  electronProcess.on('exit', (code) => {
    electronProcess = null;
  });
}

// Watch for changes except horse-info.json
const watcher = chokidar.watch(['*.js', '*.html', '!horse-info.json'], {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher.on('ready', () => {
  startElectron();
  watcher.on('change', (filePath) => {
    if (!filePath.endsWith('horse-info.json')) {
      console.log(`File changed: ${filePath}, restarting Electron...`);
      startElectron();
    }
  });
});

process.on('exit', () => {
  if (electronProcess) electronProcess.kill();
});
