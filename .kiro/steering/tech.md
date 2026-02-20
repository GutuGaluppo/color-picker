# Tech Stack

## Core Technologies

- Electron ^28.0.0 - Desktop framework
- React ^18.2.0 - UI library
- TypeScript ^5.3.3 - Type safety (strict mode)
- Vite ^5.0.8 - Build tool and dev server
- Tailwind CSS ^3.3.6 - Styling framework

## Build System

### Development
```bash
npm run electron:dev    # Start dev server + Electron with hot reload
npm run dev            # Vite dev server only
```

### Production
```bash
npm run build          # Compile TypeScript + bundle + copy assets
npm run electron:build # Create distributable packages
```

### Build Process
The build uses separate compilation paths:
- Renderer (React): Vite bundles to `dist/`
- Main/Preload: TypeScript compiler outputs to `dist-electron/`
- Assets: Copied from `electron/assets/` to `dist-electron/assets/`

### Asset Pipeline
The build process includes an asset copy step that moves icon files from `electron/assets/` to `dist-electron/assets/`.

## TypeScript Configuration

Three separate tsconfig files:
- `tsconfig.json` - Renderer process (React), noEmit mode
- `tsconfig.electron.json` - Main process (Electron), outputs to dist-electron
- `tsconfig.node.json` - Build scripts

All use strict mode with ES2020 target.

## Key Libraries

- electron-builder - Application packaging
- Canvas API - Magnifier rendering (no external canvas library)

## Security Architecture

- Context isolation: enabled
- Node integration: disabled
- Preload script uses contextBridge for secure IPC
- Renderer has no direct Node.js access
- All system operations (clipboard, screen capture) in main process

## Code Style

- Functional React components with hooks
- No class components
- TypeScript strict mode (no `any` types)
- Async/await for IPC calls
- Event cleanup in useEffect return functions
