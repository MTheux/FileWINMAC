const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const PeerDiscovery = require('./discovery');
const FileServer = require('./server');
const os = require('os');
const fs = require('fs');

let mainWindow;
let discovery;
let fileServer;
let downloadDir = path.join(os.homedir(), 'Downloads', 'Hop');

function ensureDownloadDir() {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    minWidth: 600,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Hop] Window loaded successfully');
    mainWindow.webContents.send('device-name', {
      deviceName: getDeviceName(),
      platform: process.platform,
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function getDeviceName() {
  return `${os.hostname()}'s ${process.platform === 'darwin' ? 'Mac' : 'Windows'}`;
}

app.on('ready', () => {
  console.log('[Hop] App starting...');
  ensureDownloadDir();
  createWindow();

  discovery = new PeerDiscovery(getDeviceName());
  fileServer = new FileServer(downloadDir);

  discovery.on('peer-found', (peer) => {
    console.log(`[Discovery] Found peer: ${peer.name} at ${peer.address}`);
    if (mainWindow) {
      mainWindow.webContents.send('peer-found', peer);
    }
  });

  discovery.on('peer-lost', (peerId) => {
    console.log(`[Discovery] Lost peer: ${peerId}`);
    if (mainWindow) {
      mainWindow.webContents.send('peer-lost', peerId);
    }
  });

  discovery.start();
  fileServer.start().then((port) => {
    console.log(`[Server] File server running on port ${port}`);
    discovery.setServerPort(port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.on('get-peers', (event) => {
  const peers = discovery.getPeers();
  event.reply('peers-list', peers);
});

ipcMain.on('send-offer', async (event, { peer, files, folders }) => {
  try {
    const offer = {
      items: [...files, ...folders],
      receiverPort: fileServer.port,
    };
    const response = await discovery.sendOffer(peer, offer);
    event.reply('offer-response', { peer, response });
  } catch (error) {
    event.reply('offer-error', { peer, error: error.message });
  }
});

ipcMain.on('pick-files', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
  });
  event.reply('files-picked', result.filePaths);
});

ipcMain.on('pick-folders', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections'],
  });
  event.reply('folders-picked', result.filePaths);
});

ipcMain.on('set-download-dir', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: downloadDir,
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    downloadDir = result.filePaths[0];
    event.reply('download-dir-changed', downloadDir);
  }
});

ipcMain.on('accept-files', (event, { peer, items }) => {
  fileServer.acceptTransfer(peer, items);
  event.reply('transfer-started', peer);
});

ipcMain.on('decline-files', (event, { peer }) => {
  fileServer.declineTransfer(peer);
  event.reply('transfer-declined', peer);
});

// Always show window on startup
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.destroy();
  }
});

// Force window to be shown on startup
process.on('uncaughtException', (error) => {
  console.error('[Error]', error);
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message);
  }
});
