# Design Document: Color Wheel Drawer

## Overview

The Color Wheel Drawer feature adds a slide-out panel to the Explore screen that contains an interactive color wheel component. This enhancement provides users with a visual color selection tool that complements the existing pixel-based color picker functionality.

The drawer is accessed via a clickable tab positioned on the right edge of the Explore screen. When opened, it slides in from the right side with smooth animations, overlaying the existing content without disrupting the layout. The drawer maintains the app's command-line aesthetic with glassmorphism design elements and integrates seamlessly with the existing Header and ColorHistory components.

### Key Design Goals

1. **Non-intrusive Integration**: The drawer overlays content without affecting the existing Explore screen layout or functionality
2. **Smooth User Experience**: Animated transitions provide visual feedback during open/close operations
3. **Visual Consistency**: Maintains the command-line aesthetic and glassmorphism design language
4. **Session Persistence**: Drawer state persists during the user's session but defaults to closed on app restart
5. **Minimal Implementation**: Leverages React hooks and CSS transitions without external animation libraries

## Architecture

### Component Hierarchy

```
Explore (src/screens/Explore/Explore.tsx)
├── CloseButton
├── Header
├── ColorHistory
├── DrawerTab (new)
└── Drawer (new)
    └── ColorWheel (new)
```

### State Management

The drawer state is managed locally within the Explore component using React's `useState` hook:

```typescript
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
```

This approach aligns with the existing state management pattern used for `isHistoryExpanded` and `colorFormat`. No global state management is required since the drawer state is scoped to the Explore screen.

### Layout Strategy

The drawer uses CSS positioning to overlay the Explore screen:

- **DrawerTab**: Positioned absolutely on the right edge, always visible
- **Drawer**: Positioned absolutely, slides in from the right using CSS transforms
- **Existing Content**: Remains in normal document flow, unaffected by drawer state

This overlay approach ensures that:
- The Explore window dimensions remain constant
- Existing components (Header, ColorHistory) are not re-laid out
- The close button and drag region remain accessible

## Components and Interfaces

### DrawerTab Component

**Location**: `src/screens/Explore/DrawerTab/DrawerTab.tsx`

**Purpose**: Provides a clickable tab on the right edge that toggles the drawer open/closed.

**Props Interface**:
```typescript
interface DrawerTabProps {
  isOpen: boolean;
  onClick: () => void;
}
```

**Visual Design**:
- Vertical tab with text reading "COLOR WHEEL" (rotated 90 degrees)
- Background: `command-bg` (#f5f5dc) with slight transparency
- Border: 1px solid `command-border` (#2a2a2a)
- Hover state: `command-hover` background (#e8e8d0)
- Icon: Chevron indicating direction (◀ when closed, ▶ when open)
- Dimensions: 120px height × 32px width
- Position: Absolute, right edge, vertically centered

**Accessibility**:
- `role="button"`
- `aria-label="Toggle color wheel drawer"`
- `aria-expanded={isOpen}`
- `aria-controls="color-wheel-drawer"`

### Drawer Component

**Location**: `src/screens/Explore/Drawer/Drawer.tsx`

**Purpose**: Container that slides in from the right and holds the ColorWheel component.

**Props Interface**:
```typescript
interface DrawerProps {
  isOpen: boolean;
  children: React.ReactNode;
}
```

**Visual Design**:
- Width: 320px
- Height: 100% of Explore window
- Background: `command-bg` with glassmorphism effect
- Border-left: 2px solid `command-border`
- Box shadow: -4px 0 8px rgba(0, 0, 0, 0.1)
- Padding: 24px

**Animation**:
- Transition: `transform 0.3s ease-in-out`
- Closed state: `translateX(100%)`
- Open state: `translateX(0)`

**Accessibility**:
- `id="color-wheel-drawer"`
- `role="complementary"`
- `aria-label="Color wheel panel"`
- `aria-hidden={!isOpen}`

### ColorWheel Component

**Location**: `src/screens/Explore/ColorWheel/ColorWheel.tsx`

**Purpose**: Renders an interactive circular color wheel for visual color selection.

**Props Interface**:
```typescript
interface ColorWheelProps {
  size?: number; // Default: 240
  onColorSelect?: (hex: string) => void;
}
```

**Implementation Details**:

The color wheel is rendered using HTML5 Canvas API (consistent with the existing Magnifier component approach):

1. **Canvas Setup**:
   - Square canvas element with configurable size (default 240×240px)
   - High DPI support using `devicePixelRatio`
   - Rendered in `useEffect` hook

2. **Color Wheel Rendering**:
   - HSL color space for smooth gradients
   - Outer ring: Hue gradient (0-360 degrees)
   - Inner area: Saturation/Lightness gradient
   - Center point: White (full lightness, zero saturation)

3. **Interaction**:
   - Click/drag to select color
   - Mouse position converted to HSL values
   - HSL converted to HEX using color utility functions
   - Optional callback `onColorSelect` fired with HEX value

4. **Visual Feedback**:
   - Cursor indicator showing selected position
   - Small circle outline at selection point
   - Cursor changes to crosshair on hover

**Canvas Rendering Algorithm**:
```typescript
// Pseudocode
for each pixel (x, y) in canvas:
  distance = sqrt((x - centerX)² + (y - centerY)²)
  angle = atan2(y - centerY, x - centerX)
  
  if distance <= radius:
    hue = (angle + PI) / (2 * PI) * 360
    saturation = distance / radius
    lightness = 0.5
    
    color = hslToRgb(hue, saturation, lightness)
    drawPixel(x, y, color)
```

**Accessibility**:
- `role="img"`
- `aria-label="Interactive color wheel for color selection"`
- Keyboard navigation support (future enhancement)

## Data Models

### Drawer State

```typescript
interface DrawerState {
  isOpen: boolean;
}
```

Managed in Explore component state. No persistence to localStorage or IPC required (session-only persistence).

### Color Selection

When a color is selected from the color wheel, it follows the existing color history pattern:

```typescript
// Existing pattern from ColorHistory
const handleColorSelect = async (hex: string) => {
  await window.electronAPI.addColorToHistory(hex);
  await window.electronAPI.copyToClipboard(hex);
  showCopyFeedback(hex);
};
```

This ensures consistency with the existing color capture workflow.

## Correctness Properties

