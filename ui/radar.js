class RadarDisplay {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.radius = Math.min(this.canvas.width, this.canvas.height) / 2 - 40;
    this.peers = new Map();
    this.selectedPeer = null;
    this.animationFrameId = null;

    this.setupEventListeners();
    this.draw();
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('resize', () => this.onResize());
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const [peerId, peer] of this.peers.entries()) {
      const dx = peer.x - x;
      const dy = peer.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        this.selectedPeer = peerId;
        return peerId;
      }
    }
    this.selectedPeer = null;
  }

  onResize() {
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.radius = Math.min(this.canvas.width, this.canvas.height) / 2 - 40;
  }

  addPeer(peer) {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.radius * 0.7;

    this.peers.set(peer.id, {
      ...peer,
      angle,
      distance,
      targetDistance: distance,
      x: this.centerX + Math.cos(angle) * distance,
      y: this.centerY + Math.sin(angle) * distance,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  removePeer(peerId) {
    this.peers.delete(peerId);
  }

  draw() {
    // Clear canvas
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.ctx.fillStyle = darkMode ? '#1d1d1f' : '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background circles
    this.drawBackgroundCircles(darkMode);

    // Draw peers
    this.drawPeers(darkMode);

    // Draw center device
    this.drawCenterDevice(darkMode);

    this.animationFrameId = requestAnimationFrame(() => this.draw());
  }

  drawBackgroundCircles(darkMode) {
    const color = darkMode ? '#2d2d2f' : '#f0f0f0';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    for (let i = 1; i <= 3; i++) {
      const r = (this.radius / 3) * i;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw cross
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX - this.radius * 1.1, this.centerY);
    this.ctx.lineTo(this.centerX + this.radius * 1.1, this.centerY);
    this.ctx.moveTo(this.centerX, this.centerY - this.radius * 1.1);
    this.ctx.lineTo(this.centerX, this.centerY + this.radius * 1.1);
    this.ctx.stroke();
  }

  drawPeers(darkMode) {
    for (const [peerId, peer] of this.peers.entries()) {
      // Smooth animation towards target position
      peer.distance += (peer.targetDistance - peer.distance) * 0.1;
      peer.x = this.centerX + Math.cos(peer.angle) * peer.distance;
      peer.y = this.centerY + Math.sin(peer.angle) * peer.distance;

      // Draw connection line
      this.ctx.strokeStyle = darkMode ? '#424245' : '#e0e0e0';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(peer.x, peer.y);
      this.ctx.stroke();

      // Draw peer pulse
      const pulseSize = 15 + Math.sin(peer.pulsePhase) * 3;
      peer.pulsePhase += 0.08;

      this.ctx.fillStyle = this.getPeerColor(peer, 0.2);
      this.ctx.beginPath();
      this.ctx.arc(peer.x, peer.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw peer circle
      this.ctx.fillStyle = this.getPeerColor(peer, 1);
      this.ctx.beginPath();
      this.ctx.arc(peer.x, peer.y, 12, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw peer icon
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const icon = peer.platform === 'darwin' ? '🍎' : '🪟';
      this.ctx.fillText(icon, peer.x, peer.y);

      // Draw selection ring
      if (peerId === this.selectedPeer) {
        this.ctx.strokeStyle = this.getPeerColor(peer, 1);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(peer.x, peer.y, 24, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // Draw peer label
      this.ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        peer.name.substring(0, 12),
        peer.x,
        peer.y + 28
      );
    }
  }

  drawCenterDevice(darkMode) {
    // Center circle
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, 25
    );
    gradient.addColorStop(0, '#0a84ff');
    gradient.addColorStop(1, '#0071e3');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Center icon
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('📍', this.centerX, this.centerY);
  }

  getPeerColor(peer, alpha) {
    const colors = {
      darwin: '#A2AAAD',
      win32: '#0078D4',
    };
    const rgb = colors[peer.platform] || '#0a84ff';
    return `${rgb}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }

  getSelectedPeer() {
    if (this.selectedPeer) {
      return this.peers.get(this.selectedPeer);
    }
    return null;
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RadarDisplay;
}
