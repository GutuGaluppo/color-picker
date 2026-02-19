import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, Display } from 'electron';
import {
  getAllDisplays,
  getDisplayAtPoint,
  getVirtualScreenBounds,
  initializeDisplayListeners,
  cleanupDisplayListeners,
  DisplayInfo,
} from '../../electron/displays';

// Mock Electron's screen module
vi.mock('electron', () => ({
  screen: {
    getAllDisplays: vi.fn(),
    getPrimaryDisplay: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe('Display Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state by cleaning up listeners
    cleanupDisplayListeners();
  });

  afterEach(() => {
    cleanupDisplayListeners();
  });

  describe('getAllDisplays', () => {
    it('should detect single display', () => {
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const displays = getAllDisplays();

      expect(displays).toHaveLength(1);
      expect(displays[0]).toEqual({
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      });
    });

    it('should detect multiple displays', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      const mockSecondary: Partial<Display> = {
        id: 2,
        bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
        scaleFactor: 2.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([
        mockPrimary as Display,
        mockSecondary as Display,
      ]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const displays = getAllDisplays();

      expect(displays).toHaveLength(2);
      expect(displays[0]).toEqual({
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      });
      expect(displays[1]).toEqual({
        id: 2,
        bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
        scaleFactor: 2.0,
        isPrimary: false,
      });
    });

    it('should handle no displays detected by falling back to primary', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const displays = getAllDisplays();

      expect(displays).toHaveLength(1);
      expect(displays[0].isPrimary).toBe(true);
    });

    it('should cache display list on subsequent calls', () => {
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      // First call
      getAllDisplays();
      expect(screen.getAllDisplays).toHaveBeenCalledTimes(1);

      // Second call should use cache
      getAllDisplays();
      expect(screen.getAllDisplays).toHaveBeenCalledTimes(1);
    });

    it('should handle errors by falling back to primary display', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockImplementation(() => {
        throw new Error('Display detection failed');
      });
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const displays = getAllDisplays();

      expect(displays).toHaveLength(1);
      expect(displays[0].isPrimary).toBe(true);
    });
  });

  describe('getDisplayAtPoint', () => {
    const mockPrimary: Partial<Display> = {
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
    };

    const mockSecondary: Partial<Display> = {
      id: 2,
      bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
      scaleFactor: 2.0,
    };

    beforeEach(() => {
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);
    });

    it('should find display at center point', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockPrimary as Display);

      const display = getDisplayAtPoint(960, 540);

      expect(display).not.toBeNull();
      expect(display?.id).toBe(1);
      expect(screen.getDisplayNearestPoint).toHaveBeenCalledWith({ x: 960, y: 540 });
    });

    it('should find display at edge point', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockPrimary as Display);

      const display = getDisplayAtPoint(0, 0);

      expect(display).not.toBeNull();
      expect(display?.id).toBe(1);
    });

    it('should find display at opposite edge', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockPrimary as Display);

      const display = getDisplayAtPoint(1919, 1079);

      expect(display).not.toBeNull();
      expect(display?.id).toBe(1);
    });

    it('should find secondary display at its center', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockSecondary as Display);

      const display = getDisplayAtPoint(3200, 720);

      expect(display).not.toBeNull();
      expect(display?.id).toBe(2);
      expect(display?.scaleFactor).toBe(2.0);
    });

    it('should fall back to primary display when point is outside all bounds', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(mockPrimary as Display);

      const display = getDisplayAtPoint(-100, -100);

      expect(display).not.toBeNull();
      expect(display?.isPrimary).toBe(true);
    });

    it('should handle null return from getDisplayNearestPoint', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(null as any);

      const display = getDisplayAtPoint(5000, 5000);

      expect(display).not.toBeNull();
      expect(display?.isPrimary).toBe(true);
    });

    it('should handle errors and return null', () => {
      vi.mocked(screen.getDisplayNearestPoint).mockImplementation(() => {
        throw new Error('Display lookup failed');
      });

      const display = getDisplayAtPoint(100, 100);

      expect(display).toBeNull();
    });
  });

  describe('getVirtualScreenBounds', () => {
    beforeEach(() => {
      // Clear cache before each test
      cleanupDisplayListeners();
    });

    it('should calculate bounds for single display', () => {
      const mockDisplay: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([mockDisplay as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockDisplay as Display);

      const bounds = getVirtualScreenBounds();

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });
    });

    it('should calculate bounds for horizontal dual display setup', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      const mockSecondary: Partial<Display> = {
        id: 2,
        bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
        scaleFactor: 2.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([
        mockPrimary as Display,
        mockSecondary as Display,
      ]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const bounds = getVirtualScreenBounds();

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 4480, // 1920 + 2560
        height: 1440, // max(1080, 1440)
      });
    });

    it('should calculate bounds for vertical dual display setup', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      const mockSecondary: Partial<Display> = {
        id: 2,
        bounds: { x: 0, y: 1080, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([
        mockPrimary as Display,
        mockSecondary as Display,
      ]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const bounds = getVirtualScreenBounds();

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 1920,
        height: 2160, // 1080 + 1080
      });
    });

    it('should calculate bounds for triple display setup', () => {
      const displays: Partial<Display>[] = [
        { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.0 },
        { id: 2, bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.0 },
        { id: 3, bounds: { x: 3840, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.0 },
      ];

      vi.mocked(screen.getAllDisplays).mockReturnValue(displays as Display[]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(displays[0] as Display);

      const bounds = getVirtualScreenBounds();

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 5760, // 1920 * 3
        height: 1080,
      });
    });

    it('should handle displays with negative coordinates', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      const mockSecondary: Partial<Display> = {
        id: 2,
        bounds: { x: -1920, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([
        mockPrimary as Display,
        mockSecondary as Display,
      ]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const bounds = getVirtualScreenBounds();

      expect(bounds).toEqual({
        x: -1920,
        y: 0,
        width: 3840, // from -1920 to 1920
        height: 1080,
      });
    });

    it('should return zero bounds when no displays', () => {
      vi.mocked(screen.getAllDisplays).mockReturnValue([]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue({
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      } as Display);

      // Clear cache to force re-fetch
      cleanupDisplayListeners();

      const bounds = getVirtualScreenBounds();

      // Should still get bounds from fallback primary display
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });
  });

  describe('Display Change Event Handling', () => {
    const mockPrimary: Partial<Display> = {
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
    };

    beforeEach(() => {
      vi.mocked(screen.getAllDisplays).mockReturnValue([mockPrimary as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);
    });

    it('should initialize display listeners', () => {
      const callback = vi.fn();

      initializeDisplayListeners(callback);

      expect(screen.on).toHaveBeenCalledWith('display-added', expect.any(Function));
      expect(screen.on).toHaveBeenCalledWith('display-removed', expect.any(Function));
      expect(screen.on).toHaveBeenCalledWith('display-metrics-changed', expect.any(Function));
    });

    it('should call callback when display is added', () => {
      const callback = vi.fn();
      let displayAddedHandler: ((...args: any[]) => void) | null = null;

      vi.mocked(screen.on).mockImplementation((event: string, handler: (...args: any[]) => void) => {
        if (event === 'display-added') {
          displayAddedHandler = handler;
        }
        return screen;
      });

      initializeDisplayListeners(callback);

      // Simulate display added
      const mockSecondary: Partial<Display> = {
        id: 2,
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([
        mockPrimary as Display,
        mockSecondary as Display,
      ]);

      if (displayAddedHandler) {
        (displayAddedHandler as (...args: any[]) => void)();
      }

      expect(callback).toHaveBeenCalled();
      const callbackArg = callback.mock.calls[0][0] as DisplayInfo[];
      expect(callbackArg).toHaveLength(2);
    });

    it('should call callback when display is removed', () => {
      const callback = vi.fn();
      let displayRemovedHandler: ((...args: any[]) => void) | null = null;

      vi.mocked(screen.on).mockImplementation((event: string, handler: (...args: any[]) => void) => {
        if (event === 'display-removed') {
          displayRemovedHandler = handler;
        }
        return screen;
      });

      initializeDisplayListeners(callback);

      // Simulate display removed
      vi.mocked(screen.getAllDisplays).mockReturnValue([mockPrimary as Display]);

      if (displayRemovedHandler) {
        (displayRemovedHandler as (...args: any[]) => void)();
      }

      expect(callback).toHaveBeenCalled();
      const callbackArg = callback.mock.calls[0][0] as DisplayInfo[];
      expect(callbackArg).toHaveLength(1);
    });

    it('should call callback when display metrics change', () => {
      const callback = vi.fn();
      let metricsChangedHandler: ((...args: any[]) => void) | null = null;

      vi.mocked(screen.on).mockImplementation((event: string, handler: (...args: any[]) => void) => {
        if (event === 'display-metrics-changed') {
          metricsChangedHandler = handler;
        }
        return screen;
      });

      initializeDisplayListeners(callback);

      // Simulate metrics changed
      const updatedPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 2.0, // Changed scale factor
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([updatedPrimary as Display]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(updatedPrimary as Display);

      if (metricsChangedHandler) {
        (metricsChangedHandler as (...args: any[]) => void)();
      }

      expect(callback).toHaveBeenCalled();
      const callbackArg = callback.mock.calls[0][0] as DisplayInfo[];
      expect(callbackArg[0].scaleFactor).toBe(2.0);
    });

    it('should invalidate cache on display change', () => {
      const callback = vi.fn();
      let displayAddedHandler: ((...args: any[]) => void) | null = null;

      vi.mocked(screen.on).mockImplementation((event: string, handler: (...args: any[]) => void) => {
        if (event === 'display-added') {
          displayAddedHandler = handler;
        }
        return screen;
      });

      initializeDisplayListeners(callback);

      // Initial call
      getAllDisplays();
      const initialCallCount = vi.mocked(screen.getAllDisplays).mock.calls.length;

      // Trigger display change
      if (displayAddedHandler) {
        (displayAddedHandler as (...args: any[]) => void)();
      }

      // Next call should fetch fresh data
      getAllDisplays();
      expect(vi.mocked(screen.getAllDisplays).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should cleanup listeners properly', () => {
      const callback = vi.fn();

      initializeDisplayListeners(callback);
      cleanupDisplayListeners();

      expect(screen.removeListener).toHaveBeenCalledWith('display-added', expect.any(Function));
      expect(screen.removeListener).toHaveBeenCalledWith('display-removed', expect.any(Function));
      expect(screen.removeListener).toHaveBeenCalledWith('display-metrics-changed', expect.any(Function));
    });

    it('should handle multiple initialize calls by cleaning up previous listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      initializeDisplayListeners(callback1);
      initializeDisplayListeners(callback2);

      // Should have cleaned up first set of listeners
      expect(screen.removeListener).toHaveBeenCalled();
      // Should have registered new listeners
      expect(screen.on).toHaveBeenCalledTimes(6); // 3 for first init, 3 for second init
    });
  });

  describe('Primary Display Identification', () => {
    it('should correctly identify primary display in multi-display setup', () => {
      const mockPrimary: Partial<Display> = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
      };

      const mockSecondary: Partial<Display> = {
        id: 2,
        bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
        scaleFactor: 2.0,
      };

      vi.mocked(screen.getAllDisplays).mockReturnValue([
        mockSecondary as Display,
        mockPrimary as Display,
      ]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(mockPrimary as Display);

      const displays = getAllDisplays();

      const primaryDisplay = displays.find(d => d.isPrimary);
      const secondaryDisplay = displays.find(d => !d.isPrimary);

      expect(primaryDisplay).toBeDefined();
      expect(primaryDisplay?.id).toBe(1);
      expect(secondaryDisplay).toBeDefined();
      expect(secondaryDisplay?.id).toBe(2);
    });

    it('should mark only one display as primary', () => {
      const displays: Partial<Display>[] = [
        { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.0 },
        { id: 2, bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.0 },
        { id: 3, bounds: { x: 3840, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.0 },
      ];

      vi.mocked(screen.getAllDisplays).mockReturnValue(displays as Display[]);
      vi.mocked(screen.getPrimaryDisplay).mockReturnValue(displays[1] as Display);

      const result = getAllDisplays();

      const primaryCount = result.filter(d => d.isPrimary).length;
      expect(primaryCount).toBe(1);
      expect(result.find(d => d.isPrimary)?.id).toBe(2);
    });
  });
});
