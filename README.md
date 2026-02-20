# Color Picker Desktop App

A fast, silent, and non-intrusive desktop color picker utility built with Electron, React, and TypeScript.

## Features

- 🎯 **Instant Color Capture** - Pick colors from anywhere on your screen
- ⌨️ **Global Shortcut** - `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
- 🔍 **Magnifier** - 7x7 pixel grid with real-time preview
- 📋 **Auto-Copy** - Colors automatically copied to clipboard
- 🎨 **Multiple Formats** - View colors in HEX, RGB, or HSL format
- ⚡ **Fast & Silent** - Minimal feedback, exits immediately after capture
- 🪟 **Frameless UI** - Clean, glassmorphism design
- 🔄 **Background Operation** - Runs persistently in system tray until explicitly quit
- 📜 **Color History** - View and reuse previously captured colors with format conversion
- 🖥️ **Multi-Monitor Support** - Pick colors from any connected display

## Installation

```bash
npm install
```

## Development

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server with hot-reload
2. Build main process and preload script in watch mode
3. Launch Electron with automatic restart on changes

## Build

```bash
npm run build
```

## Usage

### Method 1: Explore Window
1. Launch the app
2. Click "Start Capture" button
3. Move cursor over the color you want
4. Click to capture

### Method 2: Global Shortcut (Recommended)
1. Press `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
2. Move cursor over the color you want
3. Click to capture

### Controls
- **Click** - Capture color and copy to clipboard
- **Escape** - Cancel capture mode

### System Tray
The app runs in the background with a system tray icon. Right-click the tray icon to:
- **Start Capture** - Begin color picking
- **Show Window** - Display the explore window
- **Quit** - Exit the application

The Explore window also includes a quit button (×) in the top-right corner for quick access to exit the application.

### Color Format Selection
In the Explore window, you can choose how colors are displayed:
- **HEX** - Standard hexadecimal format (e.g., #FF5733)
- **RGB** - Red, Green, Blue values (e.g., rgb(255, 87, 51))
- **HSL** - Hue, Saturation, Lightness (e.g., hsl(9, 100%, 60%))

The selected format applies to the color history list. Colors are always copied to clipboard in HEX format.

Note: Closing windows does not quit the app. Use the system tray menu or the quit button to exit.

## Application States

1. **Background** - No windows visible, system tray active, listens for global shortcut
2. **Explore** - Control window with "Start Capture" button, color history, and format selection
3. **Capture** - Fullscreen overlay with magnifier and crosshair cursor
4. **Feedback** - Brief "✓ Copied #HEX" message (150ms) then returns to Explore window

## Tech Stack

- **Electron** - Desktop framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Canvas API** - Magnifier rendering

## Project Structure

```
color-picker/
├── electron/           # Electron main process
│   ├── main.ts        # Entry point
│   ├── windows.ts     # Window management
│   ├── shortcuts.ts   # Global shortcuts
│   ├── capture.ts     # Screen capture logic
│   ├── tray.ts        # System tray management
│   └── assets/        # Tray and app icons
├── preload/           # Secure IPC bridge
│   └── index.ts       # contextBridge API
├── src/               # React application
│   ├── screens/
│   │   ├── Explore.tsx    # Control window
│   │   └── Capture.tsx    # Color picker
│   ├── components/
│   │   └── Magnifier.tsx  # Canvas magnifier
│   ├── shared/
│   │   └── color.ts       # Color utilities
│   └── styles/
│       └── glass.css      # Glassmorphism
└── package.json
```

## Security

- Uses `contextBridge` for secure IPC
- No direct Node.js access in renderer
- Context isolation enabled
- Node integration disabled

## License

MIT
