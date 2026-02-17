# Project Structure

## Directory Layout

```
color-picker/
├── electron/          # Main process (Node.js/Electron APIs)
│   ├── main.ts       # App entry, IPC handlers
│   ├── windows.ts    # Window creation and management
│   ├── shortcuts.ts  # Global keyboard shortcuts
│   ├── capture.ts    # Screen capture and clipboard
│   └── assets/       # Tray icons and app icons
├── preload/          # Secure IPC bridge
│   └── index.ts      # contextBridge API exposure
├── src/              # Renderer process (React)
│   ├── main.tsx      # React entry point
│   ├── app.tsx       # Route handler (hash-based)
│   ├── screens/      # Full-screen views
│   │   ├── Explore.tsx   # Control window UI
│   │   └── Capture.tsx   # Color picker overlay
│   ├── components/   # Reusable components
│   │   └── Magnifier.tsx # Canvas-based magnifier
│   ├── shared/       # Utilities
│   │   └── color.ts      # RGB/HEX conversion
│   └── styles/       # CSS modules
│       └── glass.css     # Glassmorphism effects
├── dist-electron/    # Compiled main process (gitignored)
├── dist/             # Compiled renderer (gitignored)
└── node_modules/     # Dependencies (gitignored)
```

## Architecture Layers

### Main Process (Trusted)
Location: `electron/`
- Full Node.js and Electron API access
- Handles system operations (clipboard, screen capture)
- Manages windows and global shortcuts
- IPC server for renderer communication

### Preload Bridge (Secure)
Location: `preload/`
- Single file: `index.ts`
- Uses contextBridge to expose limited API
- No direct Node.js access to renderer
- Type-safe IPC channel definitions

### Renderer Process (Sandboxed)
Location: `src/`
- React application with TypeScript
- No Node.js access (only window.electronAPI)
- Hash-based routing (#/explore, #/capture)
- Canvas API for magnifier rendering

## File Naming Conventions

- TypeScript files: `.ts` for logic, `.tsx` for React components
- React components: PascalCase (e.g., `Magnifier.tsx`)
- Utilities: camelCase (e.g., `color.ts`)
- Screens: PascalCase in `screens/` folder
- CSS: kebab-case (e.g., `glass.css`)

## Import Patterns

- Relative imports within same layer
- No cross-layer imports (main ↔ renderer)
- IPC for all cross-process communication
- Shared types via `src/global.d.ts`

## State Management

- No global state library (Redux, Zustand, etc.)
- React useState/useEffect for local state
- Main process holds window references
- IPC for state synchronization when needed

## Routing

Hash-based routing in `app.tsx`:
- `#/explore` → Explore screen
- `#/capture` → Capture screen
- Windows created with specific hash in URL
