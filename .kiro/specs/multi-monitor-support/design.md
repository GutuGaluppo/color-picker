# Design Document: Multi-Monitor Support

## Overview

This design extends the color picker application to support multi-monitor setups while maintaining the existing speed, accuracy, and user experience. The enhancement enables users to pick colors from any connected display with proper handling of different scale factors, display boundaries, and coordinate spaces.

The design introduces three key capabilities:

1. **Multi-display detection and management** - Automatic detection of all connected displays with real-time updates when displays are added or removed
2. **Cross-display screen capture** - Intelligent capture that targets the display under the cursor with proper scale factor handling
3. **Persistent Explore window with color history** - The Explore window remains visible after captures and maintains a session-based history of captured colors

The implementation maintains backward compatibility with single-monitor setups and preserves the application's core design principles: speed over features, silent operation, and non-intrusive UX.

## Architecture

### High-Level Architecture

The multi-monitor support follows the existing three-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Process (Trusted)                  │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Display Manager│  │Screen Capture│  │ Window Manager  │  │
│  │  - Detection   │  │ - Per-display│  │ - Multi-display │  │
│  │  - Tracking    │  │ - Scale aware│  │   positioning   │  │
│  │  - Events      │  │ - Caching    │  │ - State mgmt    │  │
│  └────────────────┘  └──────────────┘  └─────────────────┘  │
│           │                  │                   │          │
└───────────┼──────────────────┼───────────────────┼──────────┘
            │                  │                   │
            │         IPC Bridge (Secure)          │
            │                  │                   │
┌───────────┼──────────────────┼───────────────────┼──────────┐
│           ▼                  ▼                   ▼          │
│                  Renderer Process (Sandboxed)               │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Explore Screen │  │Capture Screen│  │   Magnifier     │  │
│  │ - History list │  │ - Cursor     │  │ - Multi-display │  │
│  │ - Click-to-copy│  │   tracking   │  │   pixel sample  │  │
│  │ - Persistence  │  │ - Display    │  │ - Scale aware   │  │
│  └────────────────┘  │   detection  │  └─────────────────┘  │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Main Process Components:**

- **Display Manager** (`electron/displays.ts`) - New module
  - Detects all connected displays on startup
  - Listens for display-added/display-removed events
  - Maintains display metadata (bounds, scale factor, ID)
  - Provides display lookup by cursor position

- **Screen Capture** (`electron/capture.ts`) - Enhanced
  - Captures screen content from specific display
  - Handles scale factor conversion
  - Caches captures per display for performance
  - Returns display-specific metadata with capture

- **Window Manager** (`electron/windows.ts`) - Enhanced
  - Creates capture window spanning virtual screen
  - Manages Explore window persistence
  - Handles window state transitions
  - Maintains color history state

**Renderer Components:**

- **Explore Screen** (`src/screens/Explore.tsx`) - Enhanced
  - Displays color history list
  - Implements click-to-copy for history items
  - Styled per reference design
  - Persists across capture cycles

- **Capture Screen** (`src/screens/Capture.tsx`) - Enhanced
  - Tracks cursor across all displays
  - Determines current display from cursor position
  - Requests display-specific captures
  - Handles display boundary transitions

- **Magnifier** (`src/components/Magnifier.tsx`) - Enhanced
  - Renders pixels from correct display
  - Adjusts for display scale factors
  - Handles edge positioning near display boundaries
  - Maintains consistent offset across displays

### Data Flow

**Startup Flow:**
```
1. App starts → Display Manager detects all displays
2. Display list stored in main process
3. Explore window created and shown
4. Global shortcut registered
```

**Capture Flow:**
```
1. User triggers capture (shortcut or button)
2. Explore window hides (but doesn't close)
3. Capture window created spanning virtual screen
4. Capture screen requests initial screen capture
5. Main process captures all displays
6. Renderer receives capture data + display metadata
7. User moves cursor → Renderer tracks position
8. Renderer determines current display from cursor
9. Magnifier samples pixels from correct display data
10. User clicks → Color copied to clipboard
11. Color sent to main process for history
12. Capture window closes
13. Explore window shown with updated history
```

**Display Change Flow:**
```
1. Display connected/disconnected
2. Display Manager receives system event
3. Display list updated
4. If capture active: Capture window resized
5. If capture active: New screen captures requested
```

## Components and Interfaces

### Display Manager Module

**File:** `electron/displays.ts`

```typescript
export interface DisplayInfo {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
}

export interface VirtualScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Get all connected displays
export function getAllDisplays(): DisplayInfo[]

// Get display containing a point
export function getDisplayAtPoint(x: number, y: number): DisplayInfo | null

// Get virtual screen bounds (all displays combined)
export function getVirtualScreenBounds(): VirtualScreenBounds

// Initialize display change listeners
export function initializeDisplayListeners(
  onChange: (displays: DisplayInfo[]) => void
): void

// Cleanup listeners
export function cleanupDisplayListeners(): void
```

**Implementation Notes:**
- Uses Electron's `screen` module
- Listens to `display-added`, `display-removed`, `display-metrics-changed` events
- Caches display list, updates on events
- Primary display determined by `screen.getPrimaryDisplay()`

### Enhanced Screen Capture Module

**File:** `electron/capture.ts`

```typescript
export interface DisplayCapture {
  displayId: number;
  dataUrl: string;
  width: number;
  height: number;
  scaleFactor: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MultiDisplayCapture {
  displays: DisplayCapture[];
  virtualBounds: VirtualScreenBounds;
  timestamp: number;
}

// Capture all displays
export async function captureAllDisplays(): Promise<MultiDisplayCapture>

// Capture specific display
export async function captureDisplay(displayId: number): Promise<DisplayCapture>

// Copy text to clipboard (unchanged)
export function copyToClipboard(text: string): void
```

**Implementation Notes:**
- Uses `desktopCapturer.getSources()` with `types: ['screen']`
- Matches sources to displays by comparing dimensions
- Captures at native resolution (width * scaleFactor)
- Returns base64 data URLs for renderer consumption
- Caches captures for 100ms to avoid redundant captures

### Enhanced Window Manager

**File:** `electron/windows.ts`

```typescript
export interface ColorHistoryItem {
  hex: string;
  timestamp: number;
}

// Existing functions enhanced
export function createCaptureWindow(): BrowserWindow
export function createExploreWindow(): BrowserWindow

// New functions
export function addColorToHistory(hex: string): void
export function getColorHistory(): ColorHistoryItem[]
export function clearColorHistory(): void

// Modified behavior
// - createCaptureWindow() now spans virtual screen
// - Explore window no longer closes after capture
// - Window state tracks history
```

**Implementation Notes:**
- Capture window uses virtual screen bounds from Display Manager
- Explore window state includes `colorHistory: ColorHistoryItem[]`
- History persists in memory for session duration
- History cleared on app restart

### IPC Channel Definitions

**File:** `preload/index.ts`

```typescript
export interface ElectronAPI {
  // Existing
  captureScreen: () => Promise<MultiDisplayCapture>;
  copyToClipboard: (text: string) => Promise<boolean>;
  closeCapture: () => void;
  startCapture: () => void;
  closeExplore: () => void;
  cancelCapture: () => void;
  
  // New
  addColorToHistory: (hex: string) => Promise<void>;
  getColorHistory: () => Promise<ColorHistoryItem[]>;
  onDisplaysChanged: (callback: (displays: DisplayInfo[]) => void) => void;
}
```

**New IPC Handlers in `electron/main.ts`:**
```typescript
ipcMain.handle('add-color-to-history', async (_event, hex: string) => {
  addColorToHistory(hex);
});

ipcMain.handle('get-color-history', async () => {
  return getColorHistory();
});

ipcMain.on('displays-changed', (event) => {
  // Send display list to renderer
  event.sender.send('displays-changed', getAllDisplays());
});
```

### Enhanced Explore Screen

**File:** `src/screens/Explore.tsx`

```typescript
interface ColorHistoryItem {
  hex: string;
  timestamp: number;
}

export const Explore: React.FC = () => {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);
  
  useEffect(() => {
    // Load history on mount
    window.electronAPI.getColorHistory().then(setHistory);
  }, []);
  
  const handleHistoryClick = async (hex: string) => {
    await window.electronAPI.copyToClipboard(hex);
    // Show brief feedback
  };
  
  // Render history list with click-to-copy
  // Style per reference design
}
```

**UI Structure:**
- Header with app icon and title
- "Start Capture" button (primary action)
- Keyboard shortcut hint
- Color history list (scrollable)
- Each history item: color swatch + HEX value
- "Hide" button at bottom

### Enhanced Capture Screen

**File:** `src/screens/Capture.tsx`

```typescript
export const Capture: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState("#000000");
  const [captureData, setCaptureData] = useState<MultiDisplayCapture | null>(null);
  const [currentDisplay, setCurrentDisplay] = useState<DisplayCapture | null>(null);
  
  useEffect(() => {
    // Load all display captures
    window.electronAPI.captureScreen().then(setCaptureData);
  }, []);
  
  useEffect(() => {
    // Determine current display from mouse position
    if (captureData && mousePos) {
      const display = findDisplayAtPoint(
        mousePos.x,
        mousePos.y,
        captureData.displays
      );
      setCurrentDisplay(display);
    }
  }, [mousePos, captureData]);
  
  const handleClick = async () => {
    // Copy color
    await window.electronAPI.copyToClipboard(currentColor);
    // Add to history
    await window.electronAPI.addColorToHistory(currentColor);
    // Show feedback then close
  };
}
```

**Key Changes:**
- Loads all display captures on mount
- Tracks which display cursor is on
- Passes correct display data to Magnifier
- Adds captured color to history before closing

### Enhanced Magnifier Component

**File:** `src/components/Magnifier.tsx`

```typescript
interface MagnifierProps {
  x: number;
  y: number;
  displayCapture: DisplayCapture | null;
  onColorChange: (color: string) => void;
}

export const Magnifier: React.FC<MagnifierProps> = ({
  x,
  y,
  displayCapture,
  onColorChange,
}) => {
  // Convert screen coordinates to display-local coordinates
  const localX = displayCapture ? x - displayCapture.bounds.x : x;
  const localY = displayCapture ? y - displayCapture.bounds.y : y;
  
  // Account for scale factor
  const scaledX = localX * displayCapture.scaleFactor;
  const scaledY = localY * displayCapture.scaleFactor;
  
  // Sample pixels from display capture
  // Render magnified grid
  // Handle edge positioning
}
```

**Key Changes:**
- Receives display-specific capture data
- Converts global coordinates to display-local
- Applies scale factor for pixel sampling
- Adjusts position near display edges

## Data Models

### Display Information

```typescript
interface DisplayInfo {
  id: number;              // Unique display identifier
  bounds: {
    x: number;             // X position in virtual screen
    y: number;             // Y position in virtual screen
    width: number;         // Display width in logical pixels
    height: number;        // Display height in logical pixels
  };
  scaleFactor: number;     // DPI scale (1.0, 1.5, 2.0, etc.)
  isPrimary: boolean;      // True for primary display
}
```

### Capture Data

```typescript
interface DisplayCapture {
  displayId: number;       // Matches DisplayInfo.id
  dataUrl: string;         // Base64 encoded PNG
  width: number;           // Capture width in physical pixels
  height: number;          // Capture height in physical pixels
  scaleFactor: number;     // Display scale factor
  bounds: {
    x: number;             // Display position in virtual screen
    y: number;
    width: number;         // Display size in logical pixels
    height: number;
  };
}

interface MultiDisplayCapture {
  displays: DisplayCapture[];
  virtualBounds: {
    x: number;             // Top-left of virtual screen
    y: number;
    width: number;         // Total virtual screen width
    height: number;        // Total virtual screen height
  };
  timestamp: number;       // Capture time (for cache invalidation)
}
```

### Color History

```typescript
interface ColorHistoryItem {
  hex: string;             // Color value (e.g., "#FF5733")
  timestamp: number;       // Capture time (Date.now())
}
```

### Window State

```typescript
interface WindowState {
  exploreVisible: boolean;
  captureActive: boolean;
  colorHistory: ColorHistoryItem[];
  previousExploreState: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before defining the final properties, I've analyzed the prework to eliminate redundancy:

**Redundancies Identified:**
- Properties 5.2 (render pixels without distortion) and 8.2 (extract correct RGB values) both test pixel data accuracy - can be combined
- Properties 5.3 (magnifier adjusts for scale) and 6.4 (magnifier maintains accurate sampling) both test scale factor handling in magnifier - can be combined
- Properties 6.2 (capture accounts for scale) and 6.3 (coordinates converted with scale) both test scale factor application - these are distinct (capture vs coordinates) so both kept
- Properties 8.1 (copy HEX on click) and 12.1 (add to history on capture) both trigger on the same event - these are distinct operations so both kept

**Properties Consolidated:**
- Pixel accuracy properties combined into single comprehensive property
- Scale factor handling in magnifier combined into single property

### Property 1: Display Metadata Completeness

*For any* display in the detected display list, that display must have valid bounds (x, y, width, height), a scale factor greater than 0, and a unique identifier.

**Validates: Requirements 1.4**

### Property 2: Native Resolution Capture

*For any* display with scale factor S, the captured image dimensions must equal the display's logical dimensions multiplied by S.

**Validates: Requirements 2.4**

### Property 3: Capture Window Coverage

*For any* connected display, the capture window's bounds must fully contain that display's bounds.

**Validates: Requirements 3.2**

### Property 4: Cursor Position Accuracy

*For any* cursor position on any display, the tracked position must be within the bounds of that display's coordinate space.

**Validates: Requirements 4.1**

### Property 5: Display Boundary Continuity

*For any* cursor movement that crosses from display A to display B, the position values must remain continuous without gaps (the last position on A and first position on B must be adjacent).

**Validates: Requirements 4.3**

### Property 6: Magnifier Offset Consistency

*For any* cursor position on any display, the magnifier's offset from the cursor must be constant across all displays.

**Validates: Requirements 4.4**

### Property 7: Magnifier Grid Size

*For any* cursor position on any display, the magnifier must display exactly 49 pixels (7x7 grid) centered on the cursor position.

**Validates: Requirements 5.1**

### Property 8: Pixel Sampling Accuracy

*For any* pixel sampled by the magnifier from any display, the RGB values must match the actual screen pixel at that position, and the magnifier must render those pixels without color distortion.

**Validates: Requirements 5.2, 8.2**

### Property 9: Scale Factor Magnification

*For any* cursor position on a display with scale factor S, the magnifier must sample physical pixels accounting for S and maintain accurate pixel sampling when moving between displays with different scale factors.

**Validates: Requirements 5.3, 6.4**

### Property 10: Center Pixel Extraction

*For any* cursor position on any display, the magnifier must highlight the center pixel of the 7x7 grid and extract its color value accurately.

**Validates: Requirements 5.4**

### Property 11: Display Scale Factor Retrieval

*For any* display in the system, the display's scale factor must be retrieved and available for coordinate and capture calculations.

**Validates: Requirements 6.1**

### Property 12: Scale Factor Capture Adjustment

*For any* display with scale factor S, screen capture must account for S to capture physical pixels at native resolution.

**Validates: Requirements 6.2**

### Property 13: Scale Factor Coordinate Conversion

*For any* cursor position on a display with scale factor S, coordinate calculations must convert between logical and physical pixels using S.

**Validates: Requirements 6.3**

### Property 14: Color Copy Accuracy

*For any* click position on any display during capture mode, the HEX color value copied to clipboard must match the center pixel's actual color at that position.

**Validates: Requirements 8.1**

### Property 15: RGB to HEX Conversion Consistency

*For any* RGB value (r, g, b) where 0 ≤ r, g, b ≤ 255, converting to HEX and back to RGB must produce the original values (round-trip property).

**Validates: Requirements 8.3**

### Property 16: Display Boundary Transition

*For any* cursor movement that crosses a display boundary, the magnifier must transition to showing pixels from the new display.

**Validates: Requirements 9.2**

### Property 17: Magnifier Edge Positioning

*For any* cursor position within 60 pixels (magnifier radius) of a display edge, the magnifier must adjust its offset to remain fully visible within the display bounds.

**Validates: Requirements 9.3**

### Property 18: Single Display Backward Compatibility

*For any* operation when only one display is connected, the magnifier must render with the same accuracy as the previous version (pixel sampling produces identical results).

**Validates: Requirements 10.3**

### Property 19: History Addition

*For any* captured color with HEX value H, after capture completes, H must appear in the color history list.

**Validates: Requirements 12.1**

### Property 20: History Chronological Order

*For any* sequence of N captured colors, the history list must display them in reverse chronological order with the most recent at index 0.

**Validates: Requirements 12.2**

### Property 21: History Click-to-Copy

*For any* HEX value in the color history list, clicking that value must copy it to the clipboard.

**Validates: Requirements 12.3**

### Property 22: History Session Persistence

*For any* color added to history during an application session, that color must remain in the history list until the application is closed, surviving multiple capture cycles.

**Validates: Requirements 12.4**

## Error Handling

### Display Detection Errors

**Scenario:** No displays detected on startup
- **Handling:** Log error, fall back to primary display only, show warning in Explore window
- **Recovery:** Retry detection every 5 seconds

**Scenario:** Display disconnected during capture
- **Handling:** Resize capture window to remaining displays, invalidate captures for disconnected display
- **Recovery:** Continue capture on remaining displays

### Screen Capture Errors

**Scenario:** `desktopCapturer.getSources()` fails
- **Handling:** Log error, close capture window, restore Explore window, show error message
- **Recovery:** User can retry capture

**Scenario:** Capture source doesn't match any display
- **Handling:** Log warning, attempt to match by dimensions with tolerance
- **Recovery:** Fall back to primary display if no match

**Scenario:** Capture times out (>5 seconds)
- **Handling:** Cancel capture, close capture window, restore Explore window
- **Recovery:** User can retry

### Cursor Tracking Errors

**Scenario:** Cursor position outside all display bounds
- **Handling:** Clamp to nearest display bounds, log warning
- **Recovery:** Continue tracking, position corrects when cursor moves

**Scenario:** Cannot determine current display
- **Handling:** Fall back to primary display
- **Recovery:** Retry on next cursor movement

### Magnifier Rendering Errors

**Scenario:** Canvas context creation fails
- **Handling:** Log error, hide magnifier, allow color picking to continue
- **Recovery:** Retry canvas creation on next render

**Scenario:** Image data unavailable for sampling
- **Handling:** Display placeholder color (#000000), log error
- **Recovery:** Retry when new capture data available

### Memory Management

**Scenario:** Memory usage exceeds 150MB
- **Handling:** Clear capture cache, force garbage collection
- **Recovery:** Request new captures as needed

**Scenario:** Too many history items (>1000)
- **Handling:** Trim oldest items to keep last 1000
- **Recovery:** Automatic, transparent to user

### IPC Communication Errors

**Scenario:** IPC call fails or times out
- **Handling:** Log error, show user-friendly message, restore previous state
- **Recovery:** User can retry operation

**Scenario:** Renderer process crashes during capture
- **Handling:** Main process detects crash, closes capture window, restores Explore window
- **Recovery:** User can restart capture

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of display configurations (single, dual, triple monitors)
- Edge cases at display boundaries
- Error conditions and recovery paths
- Integration between main and renderer processes
- Window state transitions

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Coordinate transformations across arbitrary display configurations
- Color conversion accuracy across all RGB values
- History ordering with arbitrary capture sequences
- Scale factor calculations for any valid scale value

Together, these approaches provide comprehensive coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library:** fast-check (JavaScript/TypeScript property-based testing library)
- Install: `npm install --save-dev fast-check @types/fast-check`
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number

### Test File Structure:**
```
tests/
├── unit/
│   ├── displays.test.ts (587 lines) ✅
│   ├── capture.test.ts (570 lines) ✅
│   ├── windows.test.ts
│   └── components/
│       ├── Magnifier.test.tsx
│       └── Explore.test.tsx
└── properties/
    ├── display-properties.test.ts
    ├── capture-properties.test.ts (2 properties) ✅
    ├── coordinate-properties.test.ts
    └── color-properties.test.ts
```

### Property Test Examples

**Property 2: Native Resolution Capture**
```typescript
// Feature: multi-monitor-support, Property 2: Native Resolution Capture
fc.assert(
  fc.property(
    fc.record({
      width: fc.integer({ min: 800, max: 3840 }),
      height: fc.integer({ min: 600, max: 2160 }),
      scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5)
    }),
    (display) => {
      const capture = captureDisplay(display);
      return capture.width === display.width * display.scaleFactor &&
             capture.height === display.height * display.scaleFactor;
    }
  ),
  { numRuns: 100 }
);
```

**Property 15: RGB to HEX Conversion Consistency**
```typescript
// Feature: multi-monitor-support, Property 15: RGB to HEX Conversion Consistency
fc.assert(
  fc.property(
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ),
    ([r, g, b]) => {
      const hex = rgbToHex(r, g, b);
      const rgb = hexToRgb(hex);
      return rgb.r === r && rgb.g === g && rgb.b === b;
    }
  ),
  { numRuns: 100 }
);
```

**Property 20: History Chronological Order**
```typescript
// Feature: multi-monitor-support, Property 20: History Chronological Order
fc.assert(
  fc.property(
    fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }), { minLength: 1, maxLength: 50 }),
    (colors) => {
      clearColorHistory();
      const timestamps: number[] = [];
      
      colors.forEach(color => {
        const hex = `#${color}`;
        addColorToHistory(hex);
        timestamps.push(Date.now());
      });
      
      const history = getColorHistory();
      
      // Check reverse chronological order
      for (let i = 0; i < history.length - 1; i++) {
        if (history[i].timestamp < history[i + 1].timestamp) {
          return false;
        }
      }
      
      return true;
    }
  ),
  { numRuns: 100 }
);
```

### Unit Test Coverage

**Display Manager Tests:**
- Single display detection
- Multiple display detection
- Primary display identification
- Display at point lookup (center, edges, outside bounds)
- Virtual screen bounds calculation
- Display change event handling

**Screen Capture Tests:**
- Capture primary display
- Capture secondary display
- Capture all displays
- Scale factor handling (1x, 2x, 1.5x)
- Capture cache behavior
- Error handling (no sources, timeout)

**Window Manager Tests:**
- Capture window spans virtual screen
- Explore window persistence after capture
- Color history addition
- History retrieval
- History clearing
- Window state transitions

**Magnifier Component Tests:**
- Renders 7x7 grid
- Highlights center pixel
- Samples correct pixel color
- Adjusts position near edges
- Handles scale factors
- Displays on correct display

**Explore Screen Tests:**
- Loads history on mount
- Displays history items
- Click-to-copy functionality
- Feedback on copy
- Scroll behavior with many items
- Empty state display

**Integration Tests:**
- Full capture flow (start to finish)
- Multi-capture session with history
- Display change during capture
- Error recovery flows
- Keyboard shortcuts
- Window focus management

### Performance Testing

While not property-based, performance tests verify the timing requirements:

- Cursor tracking maintains 60 FPS (16ms response)
- Display switching updates within 100ms
- Screen capture completes within 200ms
- Memory usage stays under 150MB

These tests run in CI with performance budgets and fail if thresholds are exceeded.

### Manual Testing Checklist

Due to the hardware-dependent nature of multi-monitor support, manual testing is required:

- [ ] Test on single monitor setup
- [ ] Test on dual monitor setup (same resolution)
- [ ] Test on dual monitor setup (different resolutions)
- [ ] Test on dual monitor setup (different scale factors)
- [ ] Test on triple monitor setup
- [ ] Test display hotplug (connect during runtime)
- [ ] Test display hotplug (disconnect during runtime)
- [ ] Test display hotplug during active capture
- [ ] Test cursor at display boundaries
- [ ] Test magnifier near display edges
- [ ] Test color picking from each display
- [ ] Test history persistence across captures
- [ ] Test history click-to-copy
- [ ] Verify styling matches reference design
- [ ] Test on Windows, macOS, Linux

