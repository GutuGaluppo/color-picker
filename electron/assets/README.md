# System Tray Icons

This directory contains the system tray icons for the Color Picker application.

## Icon Files

- `tray-icon-mac.png` - 16x16 PNG for macOS menu bar
- `tray-icon-linux.png` - 32x32 PNG for Linux system tray
- `tray-icon-win.ico` - ICO file for Windows system tray (contains 16x16 and 32x32 sizes)

## Current Icons

The current icons are minimal placeholders created for development purposes. They display a simple 2x2 grid of colors (red, green, blue, yellow) representing a color palette.

## Replacing Icons

For production use, replace these placeholder icons with professionally designed icons that:

1. Follow platform-specific design guidelines:
   - **macOS**: Use template images (monochrome with transparency) for menu bar icons
   - **Windows**: Use full-color icons with transparency
   - **Linux**: Use full-color icons with transparency

2. Use appropriate sizes:
   - **macOS**: 16x16 or 18x18 pixels (will be scaled automatically)
   - **Windows**: 16x16 and 32x32 pixels in the ICO file
   - **Linux**: 22x22 or 24x24 pixels (32x32 works well)

3. Represent the color picker functionality (e.g., eyedropper, palette, color wheel)

## Generating New Icons

To regenerate the placeholder icons, run:

```bash
node create_icons.js
```

This will overwrite the existing icon files with new placeholder icons.
