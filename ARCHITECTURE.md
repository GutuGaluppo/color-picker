# Color Picker - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELECTRON APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              MAIN PROCESS (Node.js)                     │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │   main.ts    │  │ windows.ts   │  │shortcuts.ts  │ │    │
│  │  │              │  │              │  │              │ │    │
│  │  │ • App init   │  │ • Create win │  │ • Register   │ │    │
│  │  │ • IPC server │  │ • Manage win │  │ • Ctrl+Shift │ │    │
│  │  │ • Tray init  │  │ • Hide/Show  │  │              │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────────────────────┐   │    │
│  │  │   tray.ts    │  │         capture.ts            │   │    │
│  │  │              │  │                                │   │    │
│  │  │ • Create icon│  │ • desktopCapturer.getSources()│   │    │
│  │  │ • Menu items │  │ • clipboard.writeText()       │   │    │
│  │  │ • Quit action│  │ • RGB → HEX conversion        │   │    │
│  │  └──────────────┘  └──────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▲                                     │
│                            │ IPC (contextBridge)                │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  PRELOAD SCRIPT                         │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │              preload/index.ts                     │  │    │
│  │  │                                                    │  │    │
│  │  │  contextBridge.exposeInMainWorld('electronAPI', { │  │    │
│  │  │    captureScreen: () => ipcRenderer.invoke(...)   │  │    │
│  │  │    copyToClipboard: (text) => ipcRenderer.invoke  │  │    │
│  │  │    closeCapture: () => ipcRenderer.send(...)      │  │    │
│  │  │    ...                                             │  │    │
│  │  │  })                                                │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▲                                     │
│                            │ window.electronAPI                 │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            RENDERER PROCESS (React)                     │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │                  app.tsx                          │  │    │
│  │  │         (Route based on URL hash)                │  │    │
│  │  └───────────────────┬──────────────────────────────┘  │    │
│  │                      │                                  │    │
│  │         ┌────────────┴────────────┐                    │    │
│  │         ▼                          ▼                    │    │
│  │  ┌─────────────┐          ┌──────────────┐            │    │
│  │  │ Explore.tsx │          │ Capture.tsx  │            │    │
│  │  │             │          │              │            │    │
│  │  │ • Button UI │          │ • Overlay    │            │    │
│  │  │ • Shortcuts │          │ • Mouse track│            │    │
│  │  │ • Glass CSS │          │ • Click → copy           │    │
│  │  └─────────────┘          │              │            │    │
│  │                            │  ┌────────────────────┐  │    │
│  │                            │  │  Magnifier.tsx     │  │    │
│  │                            │  │                    │  │    │
│  │                            │  │ • <canvas>         │  │    │
│  │                            │  │ • 7x7 grid         │  │    │
│  │                            │  │ • Center highlight │  │    │
│  │                            │  │ • No smoothing     │  │    │
│  │                            │  └────────────────────┘  │    │
│  │                            └──────────────┘            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 0. Application Lifecycle
```
App starts
    ↓
main.ts initializes
    ↓
tray.ts creates system tray icon
    ↓
shortcuts.ts registers global shortcut
    ↓
windows.ts creates explore window
    ↓
App runs in background

User closes window
    ↓
Window hides (not destroyed)
    ↓
App continues running with tray

User clicks tray → Show Window
    ↓
Explore window becomes visible

User clicks tray → Quit
    ↓
Cleanup: destroy tray, unregister shortcuts
    ↓
App terminates
```

### 1. Global Shortcut Trigger
```
User presses Ctrl+Shift+C
    ↓
shortcuts.ts receives event
    ↓
windows.ts creates capture window
    ↓
Capture.tsx mounts
    ↓
Calls window.electronAPI.captureScreen()
    ↓
preload/index.ts forwards to main
    ↓
capture.ts uses desktopCapturer
    ↓
Returns base64 image to renderer
```

### 2. Color Picking
```
User moves mouse
    ↓
Capture.tsx updates mousePos state
    ↓
Magnifier.tsx receives new coordinates
    ↓
Canvas draws magnified region
    ↓
Reads center pixel from ImageData
    ↓
color.ts converts RGB → HEX
    ↓
Updates currentColor state

User clicks
    ↓
Capture.tsx calls copyToClipboard()
    ↓
preload/index.ts forwards to main
    ↓
capture.ts uses clipboard API
    ↓
Shows feedback (150ms)
    ↓
Closes capture window
```

## Security Model

```
┌─────────────────────────────────────┐
│      RENDERER (Untrusted)           │
│                                     │
│  - No Node.js access                │
│  - No require()                     │
│  - No filesystem access             │
│  - Only window.electronAPI          │
└──────────────┬──────────────────────┘
               │
               │ contextBridge (secure)
               │
┌──────────────▼──────────────────────┐
│         PRELOAD (Bridge)            │
│                                     │
│  - Limited API exposure             │
│  - Type-safe IPC                    │
│  - No direct Node.js to renderer    │
└──────────────┬──────────────────────┘
               │
               │ IPC Channel
               │
┌──────────────▼──────────────────────┐
│      MAIN PROCESS (Trusted)         │
│                                     │
│  - Full Node.js access              │
│  - Electron APIs                    │
│  - System clipboard                 │
│  - Screen capture                   │
└─────────────────────────────────────┘
```

## Application States

1. **Background** - No windows visible, system tray active, listens for global shortcut
2. **Explore** - Small control window with "Start Capture" button
3. **Capture** - Fullscreen overlay with magnifier and crosshair cursor
4. **Feedback** - Brief "✓ Copied #HEX" message (150ms) then returns to background

## Component Hierarchy

```
App
 ├─ Explore (Route: #/explore)
 │   └─ Glass container
 │       ├─ Title
 │       ├─ Start Capture button
 │       ├─ Shortcut hint
 │       └─ Hide button
 │
 └─ Capture (Route: #/capture)
     ├─ Fullscreen overlay
     ├─ Magnifier
     │   └─ Canvas
     │       ├─ Magnified region
     │       ├─ 7x7 Grid lines
     │       └─ Center highlight
     └─ Feedback toast
         └─ "✓ Copied #HEX"
```

## State Management

### Main Process State
- `exploreWindow: BrowserWindow | null`
- `captureWindow: BrowserWindow | null`
- `tray: Tray | null` - System tray instance
- `windowState: WindowState` - Tracks window visibility
- Global shortcut registration

### Renderer State (Explore)
- None (stateless component)

### Renderer State (Capture)
```typescript
{
  mousePos: { x: number, y: number },
  currentColor: string,
  screenImage: HTMLImageElement | null,
  showFeedback: boolean,
  copiedColor: string
}
```

## Performance Considerations

### ✅ Optimized
- Screen captured once per session
- Canvas uses `willReadFrequently: true`
- React memoization for Magnifier
- Minimal re-renders
- Image smoothing disabled

### ⚠️ Potential Bottlenecks
- High DPI screens → larger image data
- Rapid mouse movement → many renders
- Large screen captures → memory usage

### 🛠️ Solutions Applied
- UseCallback for event handlers
- Ref for timeout management
- Conditional rendering
- Immediate cleanup on unmount

## Technology Stack Details

### Electron (Main Process)
- **Version**: ^28.0.0
- **APIs Used**:
  - `desktopCapturer` - Screen capture
  - `clipboard` - Copy operations
  - `globalShortcut` - Keyboard hooks
  - `BrowserWindow` - Window management
  - `ipcMain` - IPC server

### React (Renderer Process)
- **Version**: ^18.2.0
- **Hooks Used**:
  - `useState` - Component state
  - `useEffect` - Side effects
  - `useCallback` - Memoized functions
  - `useRef` - DOM/timeout refs

### TypeScript
- **Version**: ^5.3.3
- **Configuration**:
  - Strict mode enabled
  - ES2020 target
  - React JSX

### Build Tools
- **Vite**: Dev server + HMR
- **vite-plugin-electron**: Electron integration
- **electron-builder**: Distribution

## File Size Breakdown
```
Main Process Bundle:   ~50 KB
Renderer Bundle:      ~150 KB
Electron Runtime:    ~200 MB
Total App Size:      ~200 MB (typical)
```

## Window Specifications

### Explore Window
```javascript
{
  width: 280,
  height: 140,
  resizable: false,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true
}
```

### Capture Window
```javascript
{
  width: screenWidth,
  height: screenHeight,
  x: 0,
  y: 0,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  // fullscreen: true
}
```

## Magnifier Specifications
```javascript
{
  size: 120x120 pixels,
  grid: 7x7 cells,
  cellSize: ~17px,
  offset: { x: 20, y: 20 },
  centerHighlight: 2px white border,
  imageSmoothing: false
}
```

---
**Last Updated**: January 2025
