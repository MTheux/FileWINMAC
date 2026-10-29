const dgram = require('dgram');
const os = require('os');
const crypto = require('crypto');
const { EventEmitter } = require('events');

const DISCOVERY_PORT = 47800;
const BEACON_INTERVAL = 1500;
const PEER_TIMEOUT = 10000;

class PeerDiscovery extends EventEmitter {
  constructor(deviceName) {
    super();
    this.deviceName = deviceName;
    this.deviceId = crypto.randomBytes(8).toString('hex');
    this.peers = new Map();
    this.socket = null;
    this.broadcastAddresses = [];
    this.serverPort = null;
    this.trustList = new Set();
    this.loadTrustList();
  }

  start() {
    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', (msg, rinfo) => {
      try {
        const beacon = JSON.parse(msg.toString());
        this.handleBeacon(beacon, rinfo);
      } catch (e) {
        console.error('[Discovery] Invalid beacon:', e.message);
      }
    });

    this.socket.on('error', (err) => {
      console.error('[Discovery] Socket error:', err);
    });

    this.socket.bind(DISCOVERY_PORT, () => {
      console.log(`[Discovery] Listening on port ${DISCOVERY_PORT}`);
      this.socket.setBroadcast(true);
      this.calculateBroadcastAddresses();
      this.startBeacon();
    });

    setInterval(() => this.prunePeers(), 1000);
  }

  calculateBroadcastAddresses() {
    const interfaces = os.networkInterfaces();
    this.broadcastAddresses = [];

    for (const [, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          const parts = addr.address.split('.');
          parts[3] = '255';
          const broadcast = parts.join('.');
          this.broadcastAddresses.push(broadcast);
        }
      }
    }

    console.log('[Discovery] Broadcast addresses:', this.broadcastAddresses);
  }

  startBeacon() {
    setInterval(() => {
      const beacon = {
        id: this.deviceId,
        name: this.deviceName,
        address: this.getLocalIP(),
        port: this.serverPort,
        timestamp: Date.now(),
      };

      const msg = JSON.stringify(beacon);
      for (const address of this.broadcastAddresses) {
        this.socket.send(msg, 0, msg.length, DISCOVERY_PORT, address, (err) => {
          if (err) console.error('[Discovery] Broadcast error:', err);
        });
      }
    }, BEACON_INTERVAL);
  }

  handleBeacon(beacon, rinfo) {
    if (beacon.id === this.deviceId) return;

    const peerId = beacon.id;
    if (!this.peers.has(peerId)) {
      const peer = {
        id: peerId,
        name: beacon.name,
        address: rinfo.address,
        port: beacon.port,
        lastSeen: Date.now(),
        trusted: this.trustList.has(peerId),
      };
      this.peers.set(peerId, peer);
      this.emit('peer-found', peer);
      console.log(`[Discovery] New peer: ${peer.name}`);
    } else {
      const peer = this.peers.get(peerId);
      peer.lastSeen = Date.now();
    }
  }

  prunePeers() {
    const now = Date.now();
    for (const [peerId, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > PEER_TIMEOUT) {
        this.peers.delete(peerId);
        this.emit('peer-lost', peerId);
        console.log(`[Discovery] Peer lost: ${peer.name}`);
      }
    }
  }

  getPeers() {
    return Array.from(this.peers.values());
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const [, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
    return 'localhost';
  }

  setServerPort(port) {
    this.serverPort = port;
  }

  async sendOffer(peer, offer) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const data = JSON.stringify(offer);

      const options = {
        hostname: peer.address,
        port: peer.port,
        path: '/offer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid response from peer'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.abort();
        reject(new Error('Peer request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  trustPeer(peerId) {
    this.trustList.add(peerId);
    this.saveTrustList();
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.trusted = true;
    }
  }

  untrustPeer(peerId) {
    this.trustList.delete(peerId);
    this.saveTrustList();
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.trusted = false;
    }
  }

  loadTrustList() {
    const fs = require('fs');
    const path = require('path');
    const trustFile = path.join(os.homedir(), '.hop-trust');
    if (fs.existsSync(trustFile)) {
      try {
        const data = fs.readFileSync(trustFile, 'utf-8');
        this.trustList = new Set(JSON.parse(data));
      } catch (e) {
        console.error('[Discovery] Error loading trust list:', e);
      }
    }
  }

  saveTrustList() {
    const fs = require('fs');
    const path = require('path');
    const trustFile = path.join(os.homedir(), '.hop-trust');
    fs.writeFileSync(trustFile, JSON.stringify(Array.from(this.trustList)));
  }

  stop() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

module.exports = PeerDiscovery;
