import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock Electron modules
vi.mock('electron', () => ({
  desktopCapturer: {
    getSources: vi.fn(),
  },
  screen: {
    getPrimaryDisplay: vi.fn(),
    getAllDisplays: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  clipboard: {
    writeText: vi.fn(),
  },
}));

import { desktopCapturer } from 'electron';
import { captureAllDisplays, invalidateCaptureCache } from '../../electron/capture';
import * as displays from '../../electron/displays';

// Helper to create mock display with given configuration
function createMockDisplay(config: {
  width: number;
  height: number;
  scaleFactor: number;
  id?: number;
  x?: number;
  y?: number;
}): displays.DisplayInfo {
  return {
    id: config.id ?? 1,
    bounds: {
      x: config.x ?? 0,
      y: config.y ?? 0,
      width: config.width,
      height: config.height,
    },
    scaleFactor: config.scaleFactor,
    isPrimary: true,
  };
}

// Helper to create mock desktop capturer source
function createMockCaptureSource(displayId: number, width: number, height: number) {
  const mockThumbnail = {
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
    getSize: vi.fn().mockReturnValue({ width, height }),
  };

  return {
    id: `screen:${displayId}`,
    name: `Screen ${displayId}`,
    thumbnail: mockThumbnail as any,
    display_id: String(displayId),
    appIcon: null,
  } as any;
}

describe('Screen Capture - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCaptureCache();
    vi.resetModules();
  });

  afterEach(() => {
    invalidateCaptureCache();
    vi.clearAllMocks();
  });

  describe('Property 2: Native Resolution Capture', () => {
    it('should capture at native resolution (width * scaleFactor, height * scaleFactor) for any display configuration', async () => {
      // Feature: multi-monitor-support, Property 2: Native Resolution Capture
      // Validates: Requirements 2.4

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            width: fc.integer({ min: 800, max: 3840 }),
            height: fc.integer({ min: 600, max: 2160 }),
            scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
          }),
          async (displayConfig) => {
            // Clear state for each property iteration to prevent test pollution
            invalidateCaptureCache();
            vi.clearAllMocks();

            // Setup mock display
            const mockDisplay = createMockDisplay(displayConfig);
            vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
            vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
              x: 0,
              y: 0,
              width: displayConfig.width,
              height: displayConfig.height,
            });

            // Calculate expected native resolution
            const expectedWidth = Math.round(displayConfig.width * displayConfig.scaleFactor);
            const expectedHeight = Math.round(displayConfig.height * displayConfig.scaleFactor);

            // Mock desktop capturer with matching dimensions
            const mockSource = createMockCaptureSource(1, expectedWidth, expectedHeight);
            vi.mocked(desktopCapturer.getSources).mockResolvedValue([mockSource]);

            // Capture and verify
            const result = await captureAllDisplays();

            expect(result.displays).toHaveLength(1);
            const capture = result.displays[0];

            // Property: Captured dimensions must equal logical dimensions * scale factor
            expect(capture.width).toBe(expectedWidth);
            expect(capture.height).toBe(expectedHeight);
            expect(capture.scaleFactor).toBe(displayConfig.scaleFactor);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Scale Factor Capture Adjustment', () => {
    it('should account for scale factor when capturing physical pixels for any display', async () => {
      // Feature: multi-monitor-support, Property 12: Scale Factor Capture Adjustment
      // Validates: Requirements 6.2

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            logicalWidth: fc.integer({ min: 1024, max: 2560 }),
            logicalHeight: fc.integer({ min: 768, max: 1440 }),
            scaleFactor: fc.constantFrom(1.0, 1.5, 2.0, 2.5, 3.0),
          }),
          async (config) => {
            // Clear state for each property iteration to prevent test pollution
            invalidateCaptureCache();
            vi.clearAllMocks();

            // Setup mock display
            const mockDisplay = createMockDisplay({
              width: config.logicalWidth,
              height: config.logicalHeight,
              scaleFactor: config.scaleFactor,
            });

            vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
            vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
              x: 0,
              y: 0,
              width: config.logicalWidth,
              height: config.logicalHeight,
            });

            // Calculate physical dimensions
            const physicalWidth = Math.round(config.logicalWidth * config.scaleFactor);
            const physicalHeight = Math.round(config.logicalHeight * config.scaleFactor);

            // Mock desktop capturer with physical dimensions
            const mockSource = createMockCaptureSource(1, physicalWidth, physicalHeight);
            vi.mocked(desktopCapturer.getSources).mockResolvedValue([mockSource]);

            // Capture and verify
            const result = await captureAllDisplays();
            const capture = result.displays[0];

            // Property: Physical pixel dimensions must be logical dimensions * scale factor
            expect(capture.width).toBe(physicalWidth);
            expect(capture.height).toBe(physicalHeight);
            expect(capture.scaleFactor).toBe(config.scaleFactor);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
