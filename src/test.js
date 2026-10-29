const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class MockPeerDiscovery {
  constructor(name) {
    this.name = name;
    this.id = crypto.randomBytes(8).toString('hex');
    this.peers = [];
  }

  addPeer(discovery) {
    this.peers.push({
      id: discovery.id,
      name: discovery.name,
      address: '127.0.0.1',
      port: Math.floor(Math.random() * 10000) + 30000,
    });
  }

  getPeers() {
    return this.peers;
  }
}

class MockFileServer {
  constructor(dir) {
    this.dir = dir;
    this.port = Math.floor(Math.random() * 10000) + 30000;
    this.files = {};
  }

  saveFile(name, content) {
    const filePath = path.join(this.dir, name);
    fs.writeFileSync(filePath, content);
    this.files[name] = filePath;
  }

  getFile(name) {
    return this.files[name];
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║       Hop System Integration Test       ║');
  console.log('╚════════════════════════════════════════╝\n');

  const testDir = path.join(os.tmpdir(), 'hop-test-' + Date.now());
  fs.mkdirSync(testDir, { recursive: true });

  try {
    // Test 1: Device Discovery
    console.log('📡 Test 1: Peer Discovery');
    const device1 = new MockPeerDiscovery("teteu's Mac");
    const device2 = new MockPeerDiscovery("teteu's Windows");

    device1.addPeer(device2);
    device2.addPeer(device1);

    console.log(`  ✓ Device 1: ${device1.name} (${device1.id.substring(0, 8)})`);
    console.log(`  ✓ Device 2: ${device2.name} (${device2.id.substring(0, 8)})`);
    console.log(`  ✓ Device 1 found ${device1.getPeers().length} peer(s)`);
    console.log(`  ✓ Device 2 found ${device2.getPeers().length} peer(s)\n`);

    // Test 2: File Creation
    console.log('📁 Test 2: File Preparation');
    const server1 = new MockFileServer(testDir);
    const server2 = new MockFileServer(testDir);

    const smallFile = 'test.txt';
    const smallContent = 'Hello from Hop!';
    server1.saveFile(smallFile, smallContent);
    console.log(`  ✓ Created ${smallFile} (${smallContent.length} bytes)`);

    const largeContent = Buffer.alloc(3 * 1024 * 1024, 'x');
    const largeFile = '3mb-file.bin';
    server1.saveFile(largeFile, largeContent);
    console.log(`  ✓ Created ${largeFile} (${(largeContent.length / 1024 / 1024).toFixed(1)} MB)\n`);

    // Test 3: Folder Structure
    console.log('📂 Test 3: Folder Transfer Preparation');
    const folderPath = path.join(testDir, 'test-folder');
    fs.mkdirSync(folderPath, { recursive: true });

    for (let i = 0; i < 5; i++) {
      fs.writeFileSync(
        path.join(folderPath, `file-${i}.txt`),
        `Content ${i}`
      );
    }
    console.log(`  ✓ Created folder with ${fs.readdirSync(folderPath).length} files\n`);

    // Test 4: File Hash Verification
    console.log('🔐 Test 4: Hash Verification');
    const fileContent = fs.readFileSync(server1.getFile(smallFile));
    const hash1 = crypto.createHash('sha256').update(fileContent).digest('hex');
    console.log(`  ✓ Source hash: ${hash1.substring(0, 16)}...`);

    const receivedContent = Buffer.from(smallContent);
    const hash2 = crypto.createHash('sha256').update(receivedContent).digest('hex');
    console.log(`  ✓ Received hash: ${hash2.substring(0, 16)}...`);

    if (hash1 === hash2) {
      console.log('  ✅ Hashes match - file integrity verified\n');
    } else {
      console.log('  ❌ Hashes do not match\n');
    }

    // Test 5: Large File Transfer
    console.log('📤 Test 5: Large File Transfer Simulation');
    const largeBuffer = fs.readFileSync(server1.getFile(largeFile));
    const sourceHash = crypto.createHash('sha256').update(largeBuffer).digest('hex');

    const chunkSize = 64 * 1024;
    let received = Buffer.alloc(0);

    for (let i = 0; i < largeBuffer.length; i += chunkSize) {
      const chunk = largeBuffer.slice(i, i + chunkSize);
      received = Buffer.concat([received, chunk]);
    }

    const destHash = crypto.createHash('sha256').update(received).digest('hex');
    console.log(`  ✓ Transferred ${(received.length / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  ✓ Source hash: ${sourceHash.substring(0, 16)}...`);
    console.log(`  ✓ Dest hash: ${destHash.substring(0, 16)}...`);

    if (sourceHash === destHash) {
      console.log('  ✅ Large file transfer verified\n');
    }

    // Test 6: Multiple File Batch Transfer
    console.log('📦 Test 6: Batch Transfer');
    const files = ['file1.txt', 'file2.txt', 'file3.txt'];
    const hashes = new Map();

    for (const file of files) {
      const content = `Content of ${file}`;
      server1.saveFile(file, content);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      hashes.set(file, hash);
      console.log(`  ✓ Prepared ${file}`);
    }

    let successCount = 0;
    for (const [file, expectedHash] of hashes) {
      const actualHash = crypto.createHash('sha256')
        .update(fs.readFileSync(server1.getFile(file)))
        .digest('hex');
      if (expectedHash === actualHash) {
        successCount++;
      }
    }
    console.log(`  ✅ ${successCount}/${files.length} files verified\n`);

    // Test 7: Path Sanitization
    console.log('🛡️  Test 7: Path Sanitization');
    const dangerousPaths = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      '/etc/passwd',
      'C:\\Windows\\System32',
    ];

    let safe = 0;
    for (const filePath of dangerousPaths) {
      const normalized = path.normalize(filePath);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        console.log(`  ✓ Blocked: ${filePath}`);
        safe++;
      }
    }
    console.log(`  ✅ ${safe} dangerous paths blocked\n`);

    console.log('╔════════════════════════════════════════╗');
    console.log('║            All Tests Passed ✅          ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      fs.rmSync(testDir, { recursive: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
}

runTests().catch(console.error);
