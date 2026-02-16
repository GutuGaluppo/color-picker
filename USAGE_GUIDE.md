# Color Picker - Usage Guide

## Quick Start

### Installation & Run
```bash
cd color-picker
npm install
npm run electron:dev
```

Or simply:
```bash
./start.sh
```

## Application Flow

### Flow A: Global Shortcut (PRIMARY)
This is the main, fastest way to use the app:

1. **Trigger**: Press `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
   - Works even if no window is visible
   - Works from any application

2. **Capture Mode**: Screen becomes fullscreen transparent overlay
   - Cursor changes to crosshair
   - Magnifier (120x120px) follows cursor
   - Shows 7x7 pixel grid
   - Center pixel is highlighted

3. **Pick Color**: Click anywhere
   - Color is read from magnifier's center pixel
   - Converted to HEX format (uppercase)
   - Automatically copied to clipboard

4. **Feedback**: Brief message appears
   - Shows: "✓ Copied #RRGGBB"
   - Duration: 150ms
   - App immediately returns to background

### Flow B: Explore Window
Alternative method using the UI:

1. **Launch**: App starts with small glass window (280x140px)
   - Shows "Start Capture" button
   - Shows keyboard shortcut hint
   - Can be hidden with "Hide" button

2. **Start**: Click "Start Capture" button
   - Explore window hides automatically
   - Enters Capture Mode (same as Flow A, step 2)

3. **Continue**: Same as Flow A steps 3-4

### Canceling Capture
Press `Escape` at any time during capture to:
- Close capture overlay
- Return to explore window (if it was open)
- No feedback shown
- No color copied

## Features Explained

### Magnifier
- **Technology**: HTML5 Canvas
- **Size**: 120x120 pixels
- **Grid**: 7x7 cells (≈17px per cell)
- **Center Highlight**: White 2px border
- **Position**: Offset 20px right and down from cursor
- **Rendering**: No image smoothing (pixel-perfect)

### Color Reading
- **Source**: Center pixel of magnifier grid
- **Format**: Uppercase HEX (#RRGGBB)
- **Examples**: `#FF5733`, `#00AAFF`, `#FFFFFF`

### Screen Capture
- **Timing**: Captured ONCE when entering Capture Mode
- **Method**: Electron's `desktopCapturer` API
- **Performance**: No capture on mousemove (optimized)
- **Processing**: Real-time pixel reading from captured image

### Windows Management

#### Explore Window
- Type: Frameless, transparent, always-on-top
- Size: 280x140px
- Style: Glassmorphism effect
- Behavior: Can be hidden but not closed (runs in background)

#### Capture Window
- Type: Fullscreen, transparent, always-on-top
- Size: Full screen dimensions
- Cursor: Crosshair (CSS)
- Behavior: Closes immediately after color capture

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Start capture (Windows/Linux) |
| `Cmd+Shift+C` | Start capture (Mac) |
| `Escape` | Cancel capture |

## Application States

```
┌─────────────────────────────────────────┐
│ State 0: BACKGROUND                     │
│ - No windows visible                    │
│ - Global shortcut active                │
│ - Waiting for trigger                   │
└────────────┬────────────────────────────┘
             │
             │ App Launch
             ▼
┌─────────────────────────────────────────┐
│ State 1: EXPLORE MODE                   │
│ - Small control window                  │
│ - "Start Capture" button               │
│ - Can hide to State 0                   │
└────────────┬────────────────────────────┘
             │
             │ Button click OR Ctrl+Shift+C
             ▼
┌─────────────────────────────────────────┐
│ State 2: CAPTURE MODE                   │
│ - Fullscreen overlay                    │
│ - Magnifier active                      │
│ - Cursor = crosshair                    │
└────────────┬────────────────────────────┘
             │
             │ Mouse click
             ▼
┌─────────────────────────────────────────┐
│ State 3: FEEDBACK                       │
│ - "✓ Copied #HEX" message              │
│ - Duration: 150ms                       │
│ - Auto-close                            │
└────────────┬────────────────────────────┘
             │
             │ Automatic
             ▼
┌─────────────────────────────────────────┐
│ State 0: BACKGROUND                     │
│ (Returns to background)                 │
└─────────────────────────────────────────┘
```

## Technical Details

### Security Architecture
- **Context Isolation**: Enabled
- **Node Integration**: Disabled in renderer
- **IPC Bridge**: Secure contextBridge
- **Preload Script**: Limited API exposure

### IPC Communication

#### Renderer → Main
```typescript
window.electronAPI.startCapture()      // Trigger capture
window.electronAPI.captureScreen()     // Get screen image
window.electronAPI.copyToClipboard(hex) // Copy color
window.electronAPI.closeCapture()      // Close after copy
window.electronAPI.cancelCapture()     // Cancel (Escape)
window.electronAPI.closeExplore()      // Hide explore
```

#### Main Process Handlers
- `capture-screen`: Returns base64 screen image
- `copy-to-clipboard`: Copies text to system clipboard
- `close-capture`: Closes capture window
- `start-capture`: Opens capture window
- `cancel-capture`: Closes capture without copying
- `close-explore`: Hides explore window

### Performance Optimizations
1. Screen captured once (not on every mousemove)
2. Canvas uses `willReadFrequently: true` context
3. Image smoothing disabled for pixel-perfect rendering
4. Minimal re-renders in React components

## Troubleshooting

### Global Shortcut Not Working
- Check if another app is using `Ctrl+Shift+C`
- Try restarting the app
- Check console for registration errors

### Screen Capture Fails
- Ensure screen recording permissions (macOS)
- Check Electron's `desktopCapturer` permissions
- Try running as administrator (Windows)

### Colors Seem Wrong
- Verify no color management interfering
- Check if screen is in HDR mode
- Test with known color reference (#FF0000, #00FF00, etc.)

### App Won't Close
- Press `Escape` during capture
- Use system task manager if frozen
- Check for JavaScript errors in dev console

## Development Tips

### Hot Reload
Changes to React components reload automatically. Electron main process changes require app restart.

### Debug Mode
```bash
# Enable Electron DevTools
npm run electron:dev
# Then press Ctrl+Shift+I in any window
```

### Building for Production
```bash
npm run build
npm run electron:build
```

### Testing Color Accuracy
1. Open a color reference website
2. Use Color Picker on known colors
3. Verify HEX values match exactly

## Best Practices

### For Users
- Use global shortcut for fastest workflow
- Keep explore window hidden when not needed
- Test shortcut after system restart

### For Developers
- Never capture screen on mousemove
- Keep feedback duration ≤ 150ms
- Always use contextBridge for IPC
- Test on multiple screen resolutions

## License
MIT
