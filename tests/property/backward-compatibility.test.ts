import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock Electron modules
vi.mock('electron', () => ({
  screen: {
    getPrimaryDisplay: vi.fn(),
    getAllDisplays: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  desktopCapturer: {
    getSources: vi.fn(),
  },
}));

import { screen } from 'electron';
import { getAllDisplays, getDisplayAtPoint, getVirtualScreenBounds, cleanupDisplayListeners } from '../../electron/displays';

// Helper to create mock Electron Display object
function createMockElectronDisplay(config: {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}): any {
  return {
    id: config.id,
    bounds: {
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
    },
    scaleFactor: config.scaleFactor,
    workArea: {
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
    },
    size: {
      width: config.width,
      height: config.height,
    },
    workAreaSize: {
      width: config.width,
      height: config.height,
    },
    rotation: 0,
    touchSupport: 'unknown',
    monochrome: false,
    accelerometerSupport: 'unknown',
    colorSpace: '',
    colorDepth: 24,
    depthPerComponent: 8,
    displayFrequency: 60,
    internal: false,
    label: '',
  };
}

// Helper to setup single display mocks
function setupSingleDisplayMock(config: {
  width: number;
  height: number;
  scaleFactor: number;
  x?: number;
  y?: number;
}) {
  const mockDisplay = createMockElectronDisplay({
    id: 1,
    x: config.x ?? 0,
    y: config.y ?? 0,
    width: config.width,
    height: config.height,
    scaleFactor: config.scaleFactor,
  });

  vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay]);
  vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay);
  vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockDisplay);
  
  return mockDisplay;
}

describe('Backward Compatibility - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupDisplayListeners();
  });

  describe('Property 18: Single Display Backward Compatibility', () => {
    it('should behave identically to previous version when only one display is connected', () => {
      // Feature: multi-monitor-support, Property 18: Single Display Backward Compatibility
      // Validates: Requirements 10.3

      fc.assert(
        fc.property(
          // Generate arbitrary single display configurations
          fc.record({
            width: fc.integer({ min: 800, max: 3840 }),
            height: fc.integer({ min: 600, max: 2160 }),
            scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
            x: fc.integer({ min: 0, max: 0 }), // Single display always at origin
            y: fc.integer({ min: 0, max: 0 }),
          }),
          (displayConfig) => {
            // Clear cache and mocks for each iteration
            cleanupDisplayListeners();
            vi.clearAllMocks();
            
            // Setup single display
            const mockDisplay = setupSingleDisplayMock(displayConfig);

            // Get displays from our implementation
            const displays = getAllDisplays();

            // Property: When only one display is connected, behavior must match previous version
            
            // 1. Must detect exactly one display
            if (displays.length !== 1) {
              return false;
            }

            const display = displays[0];

            // 2. Display must be marked as primary
            if (!display.isPrimary) {
              return false;
            }

            // 3. Display bounds must match the single display
            if (
              display.bounds.x !== displayConfig.x ||
              display.bounds.y !== displayConfig.y ||
              display.bounds.width !== displayConfig.width ||
              display.bounds.height !== displayConfig.height
            ) {
              return false;
            }

            // 4. Scale factor must be preserved
            if (display.scaleFactor !== displayConfig.scaleFactor) {
              return false;
            }

            // 5. Virtual screen bounds must equal display bounds (no multi-display offset)
            const virtualBounds = getVirtualScreenBounds();
            if (
              virtualBounds.x !== displayConfig.x ||
              virtualBounds.y !== displayConfig.y ||
              virtualBounds.width !== displayConfig.width ||
              virtualBounds.height !== displayConfig.height
            ) {
              return false;
            }

            // 6. Any point within display bounds must return the display
            const testPoints = [
              { x: displayConfig.x + 10, y: displayConfig.y + 10 }, // Top-left
              { x: displayConfig.x + displayConfig.width / 2, y: displayConfig.y + displayConfig.height / 2 }, // Center
              { x: displayConfig.x + displayConfig.width - 10, y: displayConfig.y + displayConfig.height - 10 }, // Bottom-right
            ];

            // Mock getDisplayNearestPoint to return the display for points within bounds
            vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockDisplay);

            for (const point of testPoints) {
              const foundDisplay = getDisplayAtPoint(point.x, point.y);
              if (!foundDisplay || foundDisplay.id !== display.id) {
                return false;
              }
            }

            // 7. Points outside display bounds should fall back to nearest display (primary for single display)
            const outsidePoint = {
              x: displayConfig.x + displayConfig.width + 100,
              y: displayConfig.y + displayConfig.height + 100,
            };
            
            // Mock getDisplayNearestPoint to return the single display (nearest display behavior)
            vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockDisplay);
            
            const outsideDisplay = getDisplayAtPoint(outsidePoint.x, outsidePoint.y);
            // For single display, should return the display (nearest display fallback)
            if (outsideDisplay === null || outsideDisplay.id !== display.id) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce identical pixel sampling results on single display as previous version', () => {
      // Feature: multi-monitor-support, Property 18: Single Display Backward Compatibility
      // Validates: Requirements 10.3 (magnifier rendering identical)

      fc.assert(
        fc.property(
          // Generate arbitrary cursor positions and single display configuration
          fc.record({
            display: fc.record({
              width: fc.integer({ min: 800, max: 3840 }),
              height: fc.integer({ min: 600, max: 2160 }),
              scaleFactor: fc.constantFrom(1.0, 1.5, 2.0),
            }),
            cursorX: fc.integer({ min: 10, max: 1000 }),
            cursorY: fc.integer({ min: 10, max: 1000 }),
          }),
          ({ display, cursorX, cursorY }) => {
            // Clear cache and mocks for each iteration
            cleanupDisplayListeners();
            vi.clearAllMocks();
            
            // Setup single display at origin
            setupSingleDisplayMock(display);

            const displays = getAllDisplays();

            // Skip if cursor is outside display bounds
            if (
              cursorX < 0 ||
              cursorX >= display.width ||
              cursorY < 0 ||
              cursorY >= display.height
            ) {
              return true;
            }

            // Property: Pixel sampling calculations must produce identical results
            // as the previous single-display version

            // Previous version: Direct coordinate usage (no display offset)
            const previousVersionLocalX = cursorX;
            const previousVersionLocalY = cursorY;
            const previousVersionScaledX = previousVersionLocalX * display.scaleFactor;
            const previousVersionScaledY = previousVersionLocalY * display.scaleFactor;

            // New version: Convert screen coordinates to display-local coordinates
            const currentDisplay = displays[0];
            const newVersionLocalX = cursorX - currentDisplay.bounds.x; // Should be same as cursorX since x=0
            const newVersionLocalY = cursorY - currentDisplay.bounds.y; // Should be same as cursorY since y=0
            const newVersionScaledX = newVersionLocalX * currentDisplay.scaleFactor;
            const newVersionScaledY = newVersionLocalY * currentDisplay.scaleFactor;

            // Verify calculations produce identical results
            if (
              previousVersionLocalX !== newVersionLocalX ||
              previousVersionLocalY !== newVersionLocalY ||
              previousVersionScaledX !== newVersionScaledX ||
              previousVersionScaledY !== newVersionScaledY
            ) {
              return false;
            }

            // Verify physical pixel coordinates are identical
            const physicalWidth = display.width * display.scaleFactor;
            const physicalHeight = display.height * display.scaleFactor;

            if (
              newVersionScaledX < 0 ||
              newVersionScaledX >= physicalWidth ||
              newVersionScaledY < 0 ||
              newVersionScaledY >= physicalHeight
            ) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain same capture window bounds on single display as previous version', () => {
      // Feature: multi-monitor-support, Property 18: Single Display Backward Compatibility
      // Validates: Requirements 10.3 (capture window behavior unchanged)

      fc.assert(
        fc.property(
          // Generate arbitrary single display configurations
          fc.record({
            width: fc.integer({ min: 800, max: 3840 }),
            height: fc.integer({ min: 600, max: 2160 }),
            scaleFactor: fc.constantFrom(1.0, 1.5, 2.0),
          }),
          (displayConfig) => {
            // Clear cache first
            cleanupDisplayListeners();
            
            // Setup single display at origin (this will populate the cache)
            setupSingleDisplayMock(displayConfig);

            // Get virtual screen bounds (used for capture window)
            const virtualBounds = getVirtualScreenBounds();

            // Property: For single display, virtual screen bounds must equal display bounds
            // (same as previous version where capture window covered the single display)

            // Previous version: Capture window covered the primary display
            const previousVersionBounds = {
              x: 0,
              y: 0,
              width: displayConfig.width,
              height: displayConfig.height,
            };

            // New version: Capture window covers virtual screen
            const newVersionBounds = virtualBounds;

            // Verify bounds are identical
            return (
              previousVersionBounds.x === newVersionBounds.x &&
              previousVersionBounds.y === newVersionBounds.y &&
              previousVersionBounds.width === newVersionBounds.width &&
              previousVersionBounds.height === newVersionBounds.height
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
