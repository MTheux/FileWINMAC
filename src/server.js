const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class FileServer extends EventEmitter {
  constructor(downloadDir) {
    super();
    this.downloadDir = downloadDir;
    this.port = null;
    this.server = null;
    this.pendingOffers = new Map();
    this.acceptedTransfers = new Map();
  }

  async start() {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(0, '0.0.0.0', () => {
        this.port = this.server.address().port;
        console.log(`[FileServer] Started on port ${this.port}`);
        resolve(this.port);
      });
    });
  }

  handleRequest(req, res) {
    if (req.method === 'POST' && req.path === '/offer') {
      this.handleOffer(req, res);
    } else if (req.method === 'GET' && req.url.startsWith('/download/')) {
      this.handleDownload(req, res);
    } else if (req.method === 'POST' && req.url.startsWith('/upload/')) {
      this.handleUpload(req, res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  handleOffer(req, res) {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const offer = JSON.parse(body);
        const offerId = Math.random().toString(36).substring(7);
        this.pendingOffers.set(offerId, {
          items: offer.items,
          senderPort: offer.receiverPort,
          senderAddress: req.connection.remoteAddress,
        });

        this.emit('offer-received', {
          offerId,
          items: offer.items,
          senderAddress: req.connection.remoteAddress,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ offerId, status: 'pending' }));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid offer');
      }
    });
  }

  handleDownload(req, res) {
    const filePath = decodeURIComponent(req.url.substring(10));
    const safeFile = path.join(this.downloadDir, filePath);

    if (!safeFile.startsWith(this.downloadDir)) {
      res.writeHead(403);
      res.end('Access denied');
      return;
    }

    fs.stat(safeFile, (err, stats) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }

      if (stats.isDirectory()) {
        res.writeHead(400);
        res.end('Cannot download directory');
        return;
      }

      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(safeFile)}"`,
      });

      fs.createReadStream(safeFile).pipe(res);
    });
  }

  handleUpload(req, res) {
    const offerId = req.url.substring(8);
    if (!this.acceptedTransfers.has(offerId)) {
      res.writeHead(403);
      res.end('Transfer not accepted');
      return;
    }

    const transfer = this.acceptedTransfers.get(offerId);
    const fileName = req.headers['x-filename'];
    if (!fileName) {
      res.writeHead(400);
      res.end('Missing filename');
      return;
    }

    const filePath = this.sanitizePath(fileName);
    const fullPath = path.join(this.downloadDir, filePath);

    fs.createWriteStream(fullPath).on('finish', () => {
      res.writeHead(200);
      res.end('File received');
    }).on('error', (err) => {
      res.writeHead(500);
      res.end('Error saving file');
    });

    req.pipe(res.writable ? res : fs.createWriteStream(fullPath));
  }

  sanitizePath(filePath) {
    const normalized = path.normalize(filePath);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      throw new Error('Invalid path');
    }
    return normalized;
  }

  acceptTransfer(peer, items) {
    const offerId = Math.random().toString(36).substring(7);
    this.acceptedTransfers.set(offerId, {
      peer,
      items,
      status: 'accepted',
    });
  }

  declineTransfer(peer) {
    for (const [id, transfer] of this.acceptedTransfers.entries()) {
      if (transfer.peer.id === peer.id) {
        this.acceptedTransfers.delete(id);
      }
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = FileServer;
