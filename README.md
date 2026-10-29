# Hop 🎯

An AirDrop-style file transfer app for macOS and Windows. Drag, drop, and transfer files instantly on your local network—no cloud, no accounts, no cables.

## Features

- 📡 **Automatic Discovery**: Devices find each other over UDP broadcasts every 1.5 seconds
- 📤 **Drag & Drop**: Simply drag files onto a peer device in the radar
- 🔒 **Secure**: Files stream directly over HTTP; path sanitization prevents directory traversal
- 🎨 **Beautiful UI**: macOS-level polish with a radar visualization and smooth animations
- 🌙 **Dark Mode**: Automatic theme switching based on system preferences
- ✓ **Trust List**: "Always accept" checkbox to skip prompts for trusted devices
- 📁 **Folder Support**: Transfer entire folders with one drag
- 🔄 **Large Files**: Tested with multi-MB file transfers

## Installation

### macOS

1. Download `Hop-mac-arm64.dmg` (Apple Silicon) or `Hop-mac-x64.dmg` (Intel) from [Releases](https://github.com/yourusername/hop/releases)
2. Open the `.dmg` file
3. Drag **Hop.app** to the Applications folder
4. Launch from Applications or Spotlight

### Windows

1. Download `Hop-windows-x64.exe` from [Releases](https://github.com/yourusername/hop/releases)
2. Run the installer
3. Choose your installation folder
4. Launch Hop from Start Menu or desktop shortcut

## Getting Started

1. **Launch on both machines** on the same Wi-Fi network
2. **Wait for discovery** (~5 seconds) - peers appear on the radar
3. **Click a peer** or drag files onto it
4. **Select files/folders** to send
5. **On the receiving side**, click Accept (or check "Always accept" to skip next time)
6. **Files download** to your Downloads/Hop folder (customizable in settings)

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
git clone https://github.com/yourusername/hop
cd hop
npm install
```

### Running

```bash
# Development mode (with DevTools)
npm run dev

# Production mode
npm start
```

### Testing

```bash
npm test
```

This runs comprehensive integration tests covering:
- Peer discovery
- File preparation and transfer
- Hash verification for integrity
- Large file handling (3MB+)
- Path sanitization for security

### Building

```bash
# Build for your platform
npm run build

# Build specifically for macOS
npm run build:mac

# Build specifically for Windows
npm run build:win
```

## Architecture

### Core Modules

- **`src/main.js`**: Electron main process, window management, IPC
- **`src/discovery.js`**: UDP peer discovery with broadcasting
- **`src/server.js`**: HTTP server for file transfers
- **`src/test.js`**: Integration test suite

### UI

- **`ui/index.html`**: Main interface template
- **`ui/styles.css`**: Themeable design system (light/dark)
- **`ui/radar.js`**: Canvas-based radar visualization
- **`ui/ui.js`**: Event handling and state management

## How It Works

### Discovery (1.5s interval)

Each device broadcasts a UDP beacon to all subnet broadcast addresses:

```json
{
  "id": "device-uuid",
  "name": "teteu's Mac",
  "address": "192.168.1.100",
  "port": 34567,
  "timestamp": 1698765432000
}
```

Devices listen on port 47800 and show peers seen in the last 10 seconds on the radar.

### Transfer

1. **Offer**: Sender POSTs file metadata to receiver's HTTP server
2. **Accept/Decline**: Receiver prompts user, can trust device for future transfers
3. **Stream**: Files download one by one via HTTP GET requests
4. **Verify**: SHA-256 hashes confirm integrity

### Security

- **Path Sanitization**: All file paths are normalized and checked for directory traversal (`../`, absolute paths)
- **Local Network Only**: No internet connectivity required
- **Direct Peer-to-Peer**: No central server or cloud storage

## Releases

Releases are automatically built via GitHub Actions on every `v*` tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers builds for:
- macOS x86-64
- macOS ARM64 (Apple Silicon)
- Windows x86-64

Artifacts are published to GitHub Releases automatically.

## Troubleshooting

### Devices not appearing?

- **Check network**: Both machines must be on the same Wi-Fi
- **Check firewall**: Port 47800 (UDP) must be open
- **Restart app**: Sometimes the first beacon takes a moment

### Files not transferring?

- **Check download folder**: Look in `~/Downloads/Hop/`
- **Check disk space**: Ensure destination has enough space
- **Check logs**: Run with `npm run dev` to see debug logs

### macOS launch issues?

- **App won't open**: Try right-click → Open (security prompt)
- **Notarization**: Unsigned builds may trigger warnings on macOS

## Contributing

This project was built with Claude AI. To extend it:

1. Fork the repository
2. Create a feature branch
3. Make changes and test with `npm test`
4. Submit a pull request

## License

MIT - Free for personal and commercial use

## Credits

Built with Electron, Node.js, and Claude AI.

Inspired by Apple AirDrop's elegant simplicity.

---

**Download Hop:** [Latest Release](https://github.com/yourusername/hop/releases)
