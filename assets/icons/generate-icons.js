const fs = require('fs');
const path = require('path');

// Create placeholder PNG as base64
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const iconDir = __dirname;

// Create Windows ICO (simplified)
const windowsIcoBase64 = 'AAABAAEAEBAQAAEABACsAQAAFgAAACAgAAABACAAqBAAANoBAAAYGAAACAgAAAEAIABoBAAAugEAACAgAAABACAAaAQAA';

fs.writeFileSync(path.join(iconDir, 'hop.ico'), Buffer.from(windowsIcoBase64, 'base64'));
console.log('✓ Created hop.ico');

// For macOS ICNS, we'll create a placeholder
// In production, use: https://www.icoconvert.com/ or ImageMagick
fs.writeFileSync(path.join(iconDir, 'hop.icns'), Buffer.from([0x69, 0x63, 0x6e, 0x73]));
console.log('✓ Created hop.icns (placeholder)');

console.log('\nNote: For production builds:');
console.log('- hop.ico: Use https://icoconvert.com/ to convert hop-icon.svg');
console.log('- hop.icns: Use ImageMagick or online converter');
