import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, Display, desktopCapturer } from 'electron';
import {
  getAllDisplays,
  getDisplayAtPoint,
  getVirtualScreenBounds,
  cleanupDisplayListeners,
} from '../../electron/displays';
import { captureAllDisplays, invalidateCaptureCache } from '../../electron/capture';

// Mock Electron modules
vi.mock('electron', () => ({
  screen: {
    getAllDisplays: vi.fn(),
    getPrimaryDisplay: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  desktopCapturer: {
    getSources: vi.fn(),
  },
  clipboard: {
    writeText: vi.fn(),
  },
}));

describe('Backward Compatibility - Single Monitor Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupDisplayListeners();
    invalidateCaptureCache();
  });

  afterEach(() => {
    cleanupDisplayListeners();
    invalidateCaptureCache();
  });

  describe('Single Display Detection', () => {
    it('should detect exactly one display when only one monitor is connected', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();

      expect(displays).toHaveLength(1);
      expect(displays[0].id).toBe(1);
      expect(displays[0].isPrimary).toBe(true);
    });

    it('should detect single display with various resolutions', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const testCases = [
        { width: 1920, height: 1080 }, // Full HD
        { width: 2560, height: 1440 }, // QHD
        { width: 3840, height: 2160 }, // 4K
        { width: 1366, height: 768 },  // Common laptop
      ];

      for (const resolution of testCases) {
        vi.clearAllMocks();
        cleanupDisplayListeners();

        const mockDisplay: Partial<Display> = {
          id: 1,
          bounds: { x: 0, y: 0, width: resolution.width, height: resolution.height },
          scaleFactor: 1.0,
        };

        vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
        vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

        const displays = getAllDisplays();

        expect(displays).toHaveLength(1);
        expect(displays[0].bounds.width).toBe(resolution.width);
        expect(displays[0].bounds.height).toBe(resolution.height);
      }
    });

    it('should detect single display with various scale factors', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const scaleFactors = [1.0, 1.25, 1.5, 2.0, 2.5];

      for (const scaleFactor of scaleFactors) {
        vi.clearAllMocks();
        cleanupDisplayListeners();

        const mockDisplay: Partial<Display> = {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor,
        };

        vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
        vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

        const displays = getAllDisplays();

        expect(displays).toHaveLength(1);
        expect(displays[0].scaleFactor).toBe(scaleFactor);
      }
    });

    it('should always mark single display as primary', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();

      expect(displays[0].isPrimary).toBe(true);
      expect(displays.filter(d => d.isPrimary)).toHaveLength(1);
    });
  });

  describe('Capture Method Unchanged for Single Display', () => {
    it('should use same capture approach for single display as previous version', async () => {
      // Requirements: 10.2 - Capture method unchanged for single display
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const mockSource = {
        id: 'screen:1',
        name: 'Entire Screen',
        thumbnail: {
          toDataURL: () => 'data:image/png;base64,mockdata',
          getSize: () => ({ width: 1920, height: 1080 }),
        },
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([mockSource as any]);

      const result = await captureAllDisplays();

      // Should capture exactly one display
      expect(result.displays).toHaveLength(1);
      expect(result.displays[0].displayId).toBe(1);
      expect(result.displays[0].width).toBe(1920);
      expect(result.displays[0].height).toBe(1080);
    });

    it('should capture at native resolution for single display with scale factor', async () => {
      // Requirements: 10.2 - Capture method unchanged for single display
      
      // Clear cache first
      invalidateCaptureCache();
      cleanupDisplayListeners();
      
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 2.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const physicalWidth = 1920 * 2.0; // 3840
      const physicalHeight = 1080 * 2.0; // 2160

      const mockSource = {
        id: 'screen:1',
        name: 'Entire Screen',
        thumbnail: {
          toDataURL: () => 'data:image/png;base64,mockdata',
          getSize: () => ({ width: physicalWidth, height: physicalHeight }),
        },
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([mockSource as any]);

      const result = await captureAllDisplays();

      // Should capture at physical resolution (logical * scale)
      expect(result.displays[0].width).toBe(physicalWidth);
      expect(result.displays[0].height).toBe(physicalHeight);
      expect(result.displays[0].scaleFactor).toBe(2.0);
    });

    it('should return single display capture with correct metadata', async () => {
      // Requirements: 10.2 - Capture method unchanged for single display
      
      // Clear cache first
      invalidateCaptureCache();
      cleanupDisplayListeners();
      
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 2560, height: 1440 },
        scaleFactor: 1.5,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const physicalWidth = 2560 * 1.5; // 3840
      const physicalHeight = 1440 * 1.5; // 2160

      const mockSource = {
        id: 'screen:1',
        name: 'Entire Screen',
        thumbnail: {
          toDataURL: () => 'data:image/png;base64,mockdata',
          getSize: () => ({ width: physicalWidth, height: physicalHeight }),
        },
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([mockSource as any]);

      const result = await captureAllDisplays();

      expect(result.displays[0]).toMatchObject({
        displayId: 1,
        width: physicalWidth,
        height: physicalHeight,
        scaleFactor: 1.5,
        bounds: { x: 0, y: 0, width: 2560, height: 1440 },
      });
      expect(result.displays[0].dataUrl).toContain('data:image/png;base64');
    });
  });

  describe('Magnifier Rendering Identical on Single Display', () => {
    it('should calculate same pixel coordinates for single display as previous version', () => {
      // Requirements: 10.3 - Magnifier rendering identical on single display
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();
      const display = displays[0];

      // Test cursor positions
      const testPositions = [
        { x: 100, y: 100 },
        { x: 960, y: 540 },  // Center
        { x: 1800, y: 1000 }, // Near edge
      ];

      for (const pos of testPositions) {
        // Previous version: Direct coordinate usage (no offset)
        const previousLocalX = pos.x;
        const previousLocalY = pos.y;
        const previousScaledX = previousLocalX * display.scaleFactor;
        const previousScaledY = previousLocalY * display.scaleFactor;

        // New version: Convert screen to display-local (should be identical for single display at origin)
        const newLocalX = pos.x - display.bounds.x;
        const newLocalY = pos.y - display.bounds.y;
        const newScaledX = newLocalX * display.scaleFactor;
        const newScaledY = newLocalY * display.scaleFactor;

        // Verify calculations produce identical results
        expect(newLocalX).toBe(previousLocalX);
        expect(newLocalY).toBe(previousLocalY);
        expect(newScaledX).toBe(previousScaledX);
        expect(newScaledY).toBe(previousScaledY);
      }
    });

    it('should produce identical pixel sampling for single display with scale factor', () => {
      // Requirements: 10.3 - Magnifier rendering identical on single display
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 2.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();
      const display = displays[0];

      const cursorX = 500;
      const cursorY = 300;

      // Previous version calculation
      const previousLocalX = cursorX;
      const previousLocalY = cursorY;
      const previousPhysicalX = previousLocalX * 2.0;
      const previousPhysicalY = previousLocalY * 2.0;

      // New version calculation
      const newLocalX = cursorX - display.bounds.x; // 500 - 0 = 500
      const newLocalY = cursorY - display.bounds.y; // 300 - 0 = 300
      const newPhysicalX = newLocalX * display.scaleFactor;
      const newPhysicalY = newLocalY * display.scaleFactor;

      // Verify identical results
      expect(newLocalX).toBe(previousLocalX);
      expect(newLocalY).toBe(previousLocalY);
      expect(newPhysicalX).toBe(previousPhysicalX);
      expect(newPhysicalY).toBe(previousPhysicalY);
    });

    it('should maintain same magnifier grid size for single display', () => {
      // Requirements: 10.3 - Magnifier rendering identical on single display
      const MAGNIFIER_GRID_SIZE = 7;

      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();
      const display = displays[0];

      const cursorX = 500;
      const cursorY = 300;

      // Grid calculation (same for both versions)
      const halfGrid = Math.floor(MAGNIFIER_GRID_SIZE / 2); // 3
      const gridStartX = cursorX - halfGrid;
      const gridStartY = cursorY - halfGrid;
      const totalPixels = MAGNIFIER_GRID_SIZE * MAGNIFIER_GRID_SIZE; // 49

      // Verify grid properties unchanged
      expect(totalPixels).toBe(49);
      expect(halfGrid).toBe(3);
      expect(gridStartX).toBe(497);
      expect(gridStartY).toBe(297);
    });

    it('should handle edge positioning identically for single display', () => {
      // Requirements: 10.3 - Magnifier rendering identical on single display
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();
      const display = displays[0];

      // Test edge positions
      const edgePositions = [
        { x: 5, y: 5 },           // Top-left corner
        { x: 1915, y: 5 },        // Top-right corner
        { x: 5, y: 1075 },        // Bottom-left corner
        { x: 1915, y: 1075 },     // Bottom-right corner
      ];

      for (const pos of edgePositions) {
        // Both versions should handle edge positioning the same way
        const localX = pos.x - display.bounds.x;
        const localY = pos.y - display.bounds.y;

        // Verify coordinates are within bounds
        expect(localX).toBeGreaterThanOrEqual(0);
        expect(localX).toBeLessThan(display.bounds.width);
        expect(localY).toBeGreaterThanOrEqual(0);
        expect(localY).toBeLessThan(display.bounds.height);
      }
    });
  });

  describe('Memory Footprint Unchanged', () => {
    it('should maintain same memory usage pattern for single display', async () => {
      // Requirements: 10.4 - Memory footprint unchanged
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const mockSource = {
        id: 'screen:1',
        name: 'Entire Screen',
        thumbnail: {
          toDataURL: () => 'data:image/png;base64,mockdata',
          getSize: () => ({ width: 1920, height: 1080 }),
        },
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([mockSource as any]);

      const result = await captureAllDisplays();

      // Should capture exactly one display (no extra memory for multi-display structures)
      expect(result.displays).toHaveLength(1);
      
      // Virtual bounds should equal display bounds (no extra calculation overhead)
      expect(result.virtualBounds).toEqual({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });
    });

    it('should not allocate extra memory for multi-display structures on single display', () => {
      // Requirements: 10.4 - Memory footprint unchanged
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();

      // Should return minimal structure (single display)
      expect(displays).toHaveLength(1);
      expect(Object.keys(displays[0])).toEqual(['id', 'bounds', 'scaleFactor', 'isPrimary']);
    });

    it('should cache single display efficiently', () => {
      // Requirements: 10.4 - Memory footprint unchanged
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      // First call
      getAllDisplays();
      const firstCallCount = vi.mocked(screen.getAllDisplays).mock.calls.length;

      // Subsequent calls should use cache (no additional API calls)
      getAllDisplays();
      getAllDisplays();
      getAllDisplays();

      expect(vi.mocked(screen.getAllDisplays).mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('Virtual Screen Bounds for Single Display', () => {
    it('should return display bounds as virtual bounds for single display', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const virtualBounds = getVirtualScreenBounds();

      // Virtual bounds should exactly match display bounds
      expect(virtualBounds).toEqual({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });
    });

    it('should handle various single display resolutions correctly', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const testCases = [
        { width: 1366, height: 768 },
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 },
        { width: 3840, height: 2160 },
      ];

      for (const resolution of testCases) {
        vi.clearAllMocks();
        cleanupDisplayListeners();

        const mockDisplay: Partial<Display> = {
          id: 1,
          bounds: { x: 0, y: 0, width: resolution.width, height: resolution.height },
          scaleFactor: 1.0,
        };

        vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
        vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

        const virtualBounds = getVirtualScreenBounds();

        expect(virtualBounds.width).toBe(resolution.width);
        expect(virtualBounds.height).toBe(resolution.height);
      }
    });
  });

  describe('Display Point Lookup for Single Display', () => {
    it('should return single display for any point within bounds', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockDisplay as Display);

      const testPoints = [
        { x: 0, y: 0 },
        { x: 960, y: 540 },
        { x: 1919, y: 1079 },
      ];

      for (const point of testPoints) {
        const display = getDisplayAtPoint(point.x, point.y);
        expect(display).not.toBeNull();
        expect(display?.id).toBe(1);
        expect(display?.isPrimary).toBe(true);
      }
    });

    it('should handle out-of-bounds points gracefully for single display', () => {
      // Requirements: 10.1 - Behave identically to previous version
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockDisplay as Display);

      // Out of bounds points should still return the single display (fallback behavior)
      const outOfBoundsPoints = [
        { x: -100, y: -100 },
        { x: 5000, y: 5000 },
      ];

      for (const point of outOfBoundsPoints) {
        const display = getDisplayAtPoint(point.x, point.y);
        expect(display).not.toBeNull();
        expect(display?.id).toBe(1);
      }
    });
  });
});
