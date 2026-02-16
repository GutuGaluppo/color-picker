# Color Picker Desktop App

A fast, silent, and non-intrusive desktop color picker utility built with Electron, React, and TypeScript.

## Features

- 🎯 **Instant Color Capture** - Pick colors from anywhere on your screen
- ⌨️ **Global Shortcut** - `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
- 🔍 **Magnifier** - 7x7 pixel grid with real-time preview
- 📋 **Auto-Copy** - Colors automatically copied to clipboard in HEX format
- ⚡ **Fast & Silent** - Minimal feedback, exits immediately after capture
- 🪟 **Frameless UI** - Clean, glassmorphism design

## Installation

```bash
npm install
```

## Development

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server
2. Launch Electron with hot-reload enabled

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

## Application States

1. **Background** - No windows, listens for global shortcut
2. **Explore** - Small control window with "Start Capture" button
3. **Capture** - Fullscreen overlay with magnifier and crosshair cursor
4. **Feedback** - Brief "✓ Copied #HEX" message (150ms) then exits

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
│   └── capture.ts     # Screen capture logic
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
