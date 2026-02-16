#!/usr/bin/env node
/**
 * Generate system tray icons for the color picker application.
 * Creates simple PNG icons using base64-encoded data.
 */

const fs = require('fs');
const path = require('path');

// Minimal 16x16 PNG with a colorful 2x2 grid (for macOS)
// This is a valid PNG file with red, green, blue, yellow squares
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAP0lEQVR42mP8z8DwHwj+M1AAJhgYGBj+//8PxQwMDAwMjIyMUBEGBgYGRkZGqAgDAwMDIyMjVISBgYGBkZERKgIAqKwH/4W8+REAAAAASUVORK5CYII=';

// Minimal 32x32 PNG with a colorful 2x2 grid (for Linux)
const icon32Base64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAXklEQVR42u3WMQ0AIAwEwOKfBhZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgARZgAQdKVQf/rK8+AAAAAABJRU5ErkJggg==';

// For Windows ICO, we'll use the 16x16 PNG as a simple fallback
// A proper ICO would have multiple sizes, but this will work for basic functionality
const iconIcoBase64 = icon16Base64;

function createIconFiles() {
  const assetsDir = __dirname;
  
  // Create macOS icon (16x16)
  const macIconPath = path.join(assetsDir, 'tray-icon-mac.png');
  fs.writeFileSync(macIconPath, Buffer.from(icon16Base64, 'base64'));
  console.log('Created tray-icon-mac.png (16x16)');
  
  // Create Linux icon (32x32)
  const linuxIconPath = path.join(assetsDir, 'tray-icon-linux.png');
  fs.writeFileSync(linuxIconPath, Buffer.from(icon32Base64, 'base64'));
  console.log('Created tray-icon-linux.png (32x32)');
  
  // Create Windows icon (ICO format)
  // For simplicity, using PNG data - Electron can handle this
  const winIconPath = path.join(assetsDir, 'tray-icon-win.ico');
  fs.writeFileSync(winIconPath, Buffer.from(iconIcoBase64, 'base64'));
  console.log('Created tray-icon-win.ico');
  
  console.log('\nIcon files created successfully!');
  console.log('Note: These are minimal placeholder icons.');
  console.log('For production, replace with professionally designed icons.');
}

createIconFiles();
