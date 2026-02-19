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
displays.ts detects all connected displays
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
capture.ts uses captureAllDisplays()
    ↓
Returns multi-display capture data to renderer
```

### 2. Color Picking
```
User moves mouse
    ↓
Capture.tsx updates mousePos state
    ↓
findDisplayAtPoint determines current display from cursor position
    ↓
currentDisplay state updated with correct DisplayCapture
    ↓
Magnifier.tsx receives display-specific capture data
    ↓
Canvas draws magnified region from correct display
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
Capture.tsx calls addColorToHistory()
    ↓
preload/index.ts forwards both to main
    ↓
capture.ts uses clipboard API
    ↓
windows.ts adds color to history state
    ↓
Shows feedback (150ms)
    ↓
Closes capture window
    ↓
Explore window receives focus with updated history
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
2. **Explore** - Control window with "Start Capture" button and color history list
3. **Capture** - Fullscreen overlay with magnifier and crosshair cursor
4. **Feedback** - Brief "✓ Copied #HEX" message (150ms) then returns to Explore window

## Component Hierarchy

```
App
 ├─ Explore (Route: #/explore)
 │   └─ Glass container
 │       ├─ Icon
 │       ├─ Start Capture button
 │       ├─ Shortcut hint
 │       ├─ Hide button
 │       └─ Color History list
 │           └─ HEX value items (clickable)
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
- `windowState: WindowState` - Tracks window visibility and color history
  ```typescript
  interface WindowState {
    exploreVisible: boolean;
    captureActive: boolean;
    previousExploreState: boolean;
    colorHistory: ColorHistoryItem[];  // Max 1000 items, session-scoped
  }
  ```
- Global shortcut registration

### Renderer State (Explore)
```typescript
{
  colorHistory: ColorHistoryItem[] // Loaded from main process via IPC
}
```

### Renderer State (Capture)
```typescript
{
  mousePos: { x: number, y: number },
  currentColor: string,
  captureData: MultiDisplayCapture | null,
  currentDisplay: DisplayCapture | null,
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
Test Suite:           ~25 KB (unit tests)
Electron Runtime:    ~200 MB
Total App Size:      ~200 MB (typical)
```

## Window Specifications

### Explore Window
```javascript
{
  width: 400,
  height: 400,  // Increased to accommodate color history list
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
  width: virtualBounds.width,   // Spans all displays
  height: virtualBounds.height, // Spans all displays
  x: virtualBounds.x,
  y: virtualBounds.y,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  hasShadow: false,
  enableLargerThanScreen: true,  // Required for macOS multi-monitor
  visibleOnAllWorkspaces: true
}
```

**Note**: Multi-monitor support is in active development. Display Manager and Screen Capture modules are complete. Window Manager has been enhanced with color history and virtual screen spanning. See `.kiro/specs/multi-monitor-support/` for complete specification and progress.

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

### Planned Enhancements

### Multi-Monitor Support (In Progress - Task 5 Complete)
A comprehensive multi-monitor feature with complete design specification. Display Manager, Screen Capture, and Window Manager modules are now implemented.

**Completed:**
- ✅ Display Manager module (`electron/displays.ts`)
  - Display detection using Electron's screen API
  - Real-time display change event handling
  - Virtual screen bounds calculation
  - Display lookup by cursor position
  - Scale factor and bounds metadata for all displays
  - Comprehensive unit tests (587 lines)
  - Property-based test for display metadata completeness (Property 1)

- ✅ Enhanced Screen Capture module (`electron/capture.ts`)
  - Multi-display capture with `captureAllDisplays()` and `captureDisplay(displayId)`
  - Scale factor handling for retina/high-DPI displays
  - Source-to-display matching with dimension tolerance
  - 100ms capture caching for performance
  - Cache invalidation on display changes
  - Error handling with fallback to primary display
  - Comprehensive unit tests (570 lines)
  - Property-based tests for native resolution capture (Property 2) and scale factor adjustment (Property 12)

- ✅ Enhanced Window Manager module (`electron/windows.ts`)
  - Color history state management with session persistence
  - Capture window spans virtual screen bounds across all displays
  - Explore window persistence after capture (doesn't close)
  - Display disconnection handling during capture
  - Comprehensive unit tests covering all scenarios
  - Property-based tests for capture window coverage (Property 3), history addition (Property 19), history chronological order (Property 20), and history session persistence (Property 22)
  - Tests use dynamic imports for proper test isolation

- ✅ Checkpoint 1 (Task 4) - Core modules validated
  - All tests passing across Display Manager, Screen Capture, and Window Manager
  - Display Manager: 27 unit tests + 1 property test
  - Screen Capture: 13 unit tests + 2 property tests
  - Error handling: 6 unit tests
  - Launch activation: 3 property tests

- ✅ Task 5 Complete - Window Manager fully enhanced
  - All window management functionality implemented
  - Color history state management working
  - All unit and property tests passing

- ✅ Task 6 Complete - IPC channels updated
  - preload/index.ts enhanced with multi-display IPC methods
  - electron/main.ts handlers registered for all new IPC channels
  - Display change events propagate to renderer processes
  - Color history IPC methods (add/get) implemented
  - IPC communication validated through existing unit tests

**Next Steps:**
- Task 10: Enhance Explore screen with color history UI
- Task 11: Checkpoint - Ensure renderer components work
- Task 12: Implement color conversion utilities
- Task 13: Add error handling (including magnifier edge positioning)

**Architecture:**
- New Display Manager module (`electron/displays.ts`) for detection and tracking
- Enhanced Screen Capture with per-display capture and scale factor handling
- Enhanced Window Manager with color history state management
- Capture window spans entire virtual screen across all displays
- Magnifier handles display-specific pixel sampling and coordinate conversion

**Key Capabilities:**
- Detect all connected displays with bounds, scale factors, and identifiers
- Capture screen content from any display based on cursor position
- Track cursor position accurately across display boundaries
- Handle different display scale factors (retina/high-DPI)
- Maintain 60 FPS performance across multiple displays
- Support edge cases at display boundaries
- Preserve existing single-monitor behavior

**Persistent Explore Window & Color History:**
- Explore window remains visible after color capture
- Display chronological list of captured colors (newest first)
- Click any color in history to copy to clipboard
- History persists for session duration
- Styled according to reference design with glassmorphism

**Testing Strategy:**
- 22 correctness properties defined with property-based testing using fast-check
- Unit tests for specific scenarios and edge cases (Display Manager: 587 lines, Screen Capture: 570 lines)
- Property-based tests implemented for critical capture properties (Property 2, Property 12)
- Performance tests for 60 FPS and memory constraints (planned)
- Manual testing checklist for hardware-dependent scenarios
- Testing infrastructure setup complete (fast-check installed, test directories created)
- Note: Some property tests marked optional for MVP and may be skipped to accelerate delivery
- Display boundary continuity (Property 5) and magnifier offset consistency (Property 6) promoted to required for MVP

**Implementation Status:**
- Task 1 (testing infrastructure) ✅ Complete
- Task 2 (Display Manager module) ✅ Complete
  - Core interfaces and functions implemented
  - Display change event listeners active
  - Caching and virtual screen bounds working
  - Comprehensive unit tests (587 lines) covering all scenarios
  - Property-based test for display metadata completeness (Property 1)
- Task 3 (Enhanced Screen Capture) ✅ Complete
  - Multi-display capture interfaces implemented
  - Scale factor handling for all display types
  - Performance caching with 100ms duration
  - Comprehensive unit tests (570 lines) and property-based tests
  - Error handling with fallback mechanisms
- Task 4 (Checkpoint 1) ✅ Complete - All core modules validated
- Task 5 (Enhanced Window Manager) ✅ Complete
  - Color history state management implemented
  - Capture window spanning virtual screen
  - Explore window persistence working
  - Comprehensive unit and property tests passing
- Task 6 (Update IPC channels) ✅ Complete
  - preload/index.ts enhanced with all multi-display IPC methods
  - electron/main.ts handlers registered and functional
  - Display change event propagation implemented
  - Color history IPC methods working
  - Comprehensive IPC unit tests (tests/unit/ipc.test.ts)
- Task 7 (Checkpoint 2) ✅ Complete - Main process integration validated
- Task 8 (Enhance Capture screen) ✅ Complete
  - ✅ 8.1: Capture.tsx updated with multi-display support
    - MultiDisplayCapture state management implemented
    - Display detection from cursor position working
    - Color history integration complete
    - findDisplayAtPoint helper function added
  - ⏸️ 8.2-8.5: Property and unit tests marked optional for MVP
- Task 9 (Enhance Magnifier component) ✅ Complete
  - ✅ 9.1: Magnifier.tsx updated with multi-display support
    - Display-specific capture data handling implemented
    - Screen-to-local coordinate conversion working
    - Scale factor pixel sampling applied correctly
    - Consistent offset maintained across displays
    - Edge positioning deferred to error handling phase (Task 13)
  - ✅ 9.2: Property test for magnifier offset consistency (complete, required for MVP)
    - Property 6: Magnifier Offset Consistency validated
    - Tests offset consistency across arbitrary cursor positions
    - Tests offset consistency when moving between displays
    - File: tests/property/magnifier-properties.test.ts (2 test cases)
  - ✅ 9.3: Property test for magnifier grid size (complete, required for MVP)
    - Property 7: Magnifier Grid Size validated
    - Tests 7x7 grid dimensions (49 total pixels)
    - Tests grid centering on cursor position
    - Tests consistency across displays with different scale factors
    - File: tests/property/magnifier-properties.test.ts (2 test cases)
  - ✅ 9.4: Property test for pixel sampling accuracy (complete, modified for MVP)
    - Property 8: Pixel Sampling Accuracy
    - Implemented 3 test cases covering coordinate transformation, color integrity, and RGB extraction
    - Tests validate coordinate accuracy and RGB value preservation rather than full pixel sampling
    - Deferred full pixel sampling validation to post-MVP phase
    - File: tests/property/magnifier-properties.test.ts (3 test cases)
  - ✅ 9.5: Property test for scale factor magnification (complete, required for MVP)
    - Property 9: Scale Factor Magnification validated
    - Tests physical pixel sampling with scale factor application
    - Tests cross-display scale factor transitions
    - Tests physical sampling area calculations
    - File: tests/property/magnifier-properties.test.ts (3 test cases)
  - ✅ 9.6: Property test for center pixel extraction (complete, required for MVP)
    - Property 10: Center Pixel Extraction validated
    - Tests center pixel highlighting at cursor position
    - Tests color extraction accuracy from center pixel
    - Tests consistency across displays with different scale factors
    - File: tests/property/magnifier-properties.test.ts (3 test cases)
  - ✅ 9.7: Property test for display scale factor retrieval (complete, comprehensive coverage)
    - Property 11: Display Scale Factor Retrieval validated
    - Tests scale factor validity and availability for calculations
    - Tests consistency across multiple queries
    - File: tests/property/magnifier-properties.test.ts (4 test cases)
  - ✅ 9.8: Property test for scale factor coordinate conversion (covered by Property 9)
    - Property 13: Scale Factor Coordinate Conversion
    - Covered by Property 9 tests (coordinate transformation validation)
  - 🔄 9.9: Property test for magnifier edge positioning (in progress)
    - Property 17: Magnifier Edge Positioning
    - Validates: Requirements 9.3
    - Status: Deferred to error handling phase (Task 13)
  - ⏸️ 9.10: Unit tests marked optional for MVP
- Tasks 10-16: Pending (remaining renderer updates and integration)
- Checkpoints at tasks 11 and 16 for validation
- Estimated completion: 1-2 days for remaining work (Tasks 10-16)

See complete specification:
- Requirements: `.kiro/specs/multi-monitor-support/requirements.md` (13 requirements)
- Design: `.kiro/specs/multi-monitor-support/design.md` (complete architecture)
- Tasks: `.kiro/specs/multi-monitor-support/tasks.md` (implementation plan)

---
**Last Updated**: February 2026
