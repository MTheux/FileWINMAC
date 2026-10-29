let radar;
let selectedFiles = [];
let selectedFolders = [];
let currentTransfer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  setupEventListeners();
  loadPreferences();
});

function initializeUI() {
  // Initialize radar
  radar = new RadarDisplay('radar');

  // Listen for device info
  if (window.electron) {
    window.electron.onDeviceName((data) => {
      const deviceName = document.getElementById('deviceName');
      const deviceIcon = document.getElementById('deviceIcon');
      deviceName.textContent = data.deviceName;
      deviceIcon.textContent = data.platform === 'darwin' ? '🍎' : '🖥️';
    });

    // Listen for peer updates
    window.electron.onPeerFound((peer) => {
      radar.addPeer(peer);
      updatePeersList();
    });

    window.electron.onPeerLost((peerId) => {
      radar.removePeer(peerId);
      updatePeersList();
    });

    // Listen for offers
    setupOfferListeners();

    // Listen for transfers
    setupTransferListeners();
  }
}

function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', toggleTheme);

  // Download directory
  const downloadDirBtn = document.getElementById('downloadDirBtn');
  downloadDirBtn.addEventListener('click', () => {
    if (window.electron) {
      window.electron.setDownloadDir();
    }
  });

  // Offer modal
  const offerModal = document.getElementById('offerModal');
  const closeOffer = document.getElementById('closeOffer');
  closeOffer.addEventListener('click', () => {
    offerModal.classList.add('hidden');
  });

  const declineBtn = document.getElementById('declineBtn');
  declineBtn.addEventListener('click', () => {
    offerModal.classList.add('hidden');
  });

  const acceptBtn = document.getElementById('acceptBtn');
  acceptBtn.addEventListener('click', () => {
    offerModal.classList.add('hidden');
  });

  // Transfer modal
  const selectFilesBtn = document.getElementById('selectFilesBtn');
  selectFilesBtn.addEventListener('click', () => {
    if (window.electron) {
      window.electron.pickFiles();
    }
  });

  const selectFolderBtn = document.getElementById('selectFolderBtn');
  selectFolderBtn.addEventListener('click', () => {
    if (window.electron) {
      window.electron.pickFolders();
    }
  });

  const sendBtn = document.getElementById('sendBtn');
  sendBtn.addEventListener('click', initiateTransfer);

  const cancelTransferBtn = document.getElementById('cancelTransferBtn');
  cancelTransferBtn.addEventListener('click', () => {
    resetTransferModal();
  });

  // Get peers
  if (window.electron) {
    setInterval(() => {
      window.electron.getPeers();
    }, 2000);
  }
}

function setupOfferListeners() {
  window.electron.onFilesPicked((files) => {
    if (files && files.length > 0) {
      selectedFiles = files;
      updateSelectedFiles();
    }
  });

  window.electron.onFoldersPicked((folders) => {
    if (folders && folders.length > 0) {
      selectedFolders = folders;
      updateSelectedFiles();
    }
  });

  window.electron.onDownloadDirChanged((dir) => {
    showNotification(`Download folder changed to: ${dir}`);
  });
}

function setupTransferListeners() {
  window.electron.onTransferStarted((peer) => {
    showProgressModal(peer);
  });

  window.electron.onTransferDeclined((peer) => {
    showNotification(`${peer.name} declined the files`);
  });

  window.electron.onError((error) => {
    showNotification(`Error: ${error}`, 'error');
  });
}

function updatePeersList() {
  const peersList = document.getElementById('peersList');
  const peers = radar.peers;

  if (peers.size === 0) {
    peersList.innerHTML = '<div class="empty-state">🔍 Searching for devices...</div>';
    return;
  }

  peersList.innerHTML = '';
  for (const [peerId, peer] of peers.entries()) {
    const peerItem = document.createElement('div');
    peerItem.className = 'peer-item';
    peerItem.innerHTML = `
      <span class="peer-icon">${peer.platform === 'darwin' ? '🍎' : '🪟'}</span>
      <span class="peer-name">${peer.name}</span>
      ${peer.trusted ? '<span class="peer-trusted">✓</span>' : ''}
    `;

    peerItem.addEventListener('click', () => {
      showTransferModal(peer);
    });

    peersList.appendChild(peerItem);
  }
}

function updateSelectedFiles() {
  const selectedFiles = document.getElementById('selectedFiles');
  const sendBtn = document.getElementById('sendBtn');
  const allFiles = [...(selectedFiles || []), ...(selectedFolders || [])];

  if (allFiles.length === 0) {
    selectedFiles.innerHTML = 'No files selected';
    sendBtn.disabled = true;
    return;
  }

  selectedFiles.innerHTML = allFiles
    .map((file) => {
      const name = file.split('\\').pop() || file;
      return `<div class="file-item">📄 ${name}</div>`;
    })
    .join('');

  sendBtn.disabled = false;
}

function showTransferModal(peer) {
  currentTransfer = peer;
  const modal = document.getElementById('transferModal');
  modal.classList.remove('hidden');
  selectedFiles = [];
  selectedFolders = [];
  updateSelectedFiles();
}

function resetTransferModal() {
  const modal = document.getElementById('transferModal');
  modal.classList.add('hidden');
  selectedFiles = [];
  selectedFolders = [];
  currentTransfer = null;
}

function initiateTransfer() {
  if (!currentTransfer || (selectedFiles.length === 0 && selectedFolders.length === 0)) {
    return;
  }

  if (window.electron) {
    window.electron.sendOffer(currentTransfer, selectedFiles, selectedFolders);
  }

  resetTransferModal();
}

function showProgressModal(peer) {
  const modal = document.getElementById('progressModal');
  const title = document.getElementById('progressTitle');
  title.textContent = `Sending to ${peer.name}`;
  modal.classList.remove('hidden');

  animateProgressRing();
}

function animateProgressRing() {
  const canvas = document.getElementById('progressRing');
  const ctx = canvas.getContext('2d');
  let progress = 0;

  const animate = () => {
    progress += Math.random() * 0.05;
    if (progress > 1) progress = 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background circle
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Progress circle
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#0a84ff');
    gradient.addColorStop(1, '#00c7ff');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(100, 100, 80, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    const percent = Math.round(progress * 100);
    document.getElementById('progressPercent').textContent = `${percent}%`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  const btn = document.getElementById('themeToggle');
  btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadPreferences() {
  const theme = localStorage.getItem('theme') || 'auto';
  if (theme !== 'auto') {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}]`, message);
  // Could implement a toast notification system here
}

// Handle drag and drop
document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files).map((f) => f.path);
  const peer = radar.getSelectedPeer();
  if (peer && files.length > 0) {
    selectedFiles = files;
    showTransferModal(peer);
  }
});
