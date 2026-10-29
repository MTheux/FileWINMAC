const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getPeers: () => ipcRenderer.send('get-peers'),
  sendOffer: (peer, files, folders) =>
    ipcRenderer.send('send-offer', { peer, files, folders }),
  pickFiles: () => ipcRenderer.send('pick-files'),
  pickFolders: () => ipcRenderer.send('pick-folders'),
  setDownloadDir: () => ipcRenderer.send('set-download-dir'),
  acceptFiles: (peer, items) =>
    ipcRenderer.send('accept-files', { peer, items }),
  declineFiles: (peer) => ipcRenderer.send('decline-files', { peer }),

  // Listeners
  onPeerFound: (callback) =>
    ipcRenderer.on('peer-found', (event, peer) => callback(peer)),
  onPeerLost: (callback) =>
    ipcRenderer.on('peer-lost', (event, peerId) => callback(peerId)),
  onPeersList: (callback) =>
    ipcRenderer.on('peers-list', (event, peers) => callback(peers)),
  onOfferResponse: (callback) =>
    ipcRenderer.on('offer-response', (event, data) => callback(data)),
  onOfferError: (callback) =>
    ipcRenderer.on('offer-error', (event, data) => callback(data)),
  onFilesPicked: (callback) =>
    ipcRenderer.on('files-picked', (event, files) => callback(files)),
  onFoldersPicked: (callback) =>
    ipcRenderer.on('folders-picked', (event, folders) => callback(folders)),
  onDownloadDirChanged: (callback) =>
    ipcRenderer.on('download-dir-changed', (event, dir) => callback(dir)),
  onTransferStarted: (callback) =>
    ipcRenderer.on('transfer-started', (event, peer) => callback(peer)),
  onTransferDeclined: (callback) =>
    ipcRenderer.on('transfer-declined', (event, peer) => callback(peer)),
  onDeviceName: (callback) =>
    ipcRenderer.on('device-name', (event, data) => callback(data)),
  onError: (callback) =>
    ipcRenderer.on('error', (event, error) => callback(error)),
  onTransferProgress: (callback) =>
    ipcRenderer.on('transfer-progress', (event, data) => callback(data)),
  onTransferComplete: (callback) =>
    ipcRenderer.on('transfer-complete', (event, data) => callback(data)),
});
