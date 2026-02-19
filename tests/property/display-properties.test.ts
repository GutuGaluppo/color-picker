import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
}));

import { screen } from 'electron';
import { getAllDisplays, DisplayInfo } from '../../electron/displays';

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

describe('Display Manager - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 1: Display Metadata Completeness', () => {
    it('should return complete metadata (bounds, scale factor, unique ID) for any display in the detected list', () => {
      // Feature: multi-monitor-support, Property 1: Display Metadata Completeness
      // Validates: Requirements 1.4

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              x: fc.integer({ min: -3840, max: 3840 }),
              y: fc.integer({ min: -2160, max: 2160 }),
              width: fc.integer({ min: 800, max: 3840 }),
              height: fc.integer({ min: 600, max: 2160 }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5, 3.0),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (displayConfigs) => {
            // Ensure unique IDs
            const uniqueConfigs = displayConfigs.reduce((acc, config) => {
              if (!acc.some(c => c.id === config.id)) {
                acc.push(config);
              }
              return acc;
            }, [] as typeof displayConfigs);

            // Setup mock displays
            const mockElectronDisplays = uniqueConfigs.map(createMockElectronDisplay);
            const primaryDisplay = mockElectronDisplays[0];

            vi.mocked(screen.getAllDisplays).mockReturnValue(mockElectronDisplays);
            vi.mocked(screen.getPrimaryDisplay).mockReturnValue(primaryDisplay);

            // Get displays from our implementation
            const displays = getAllDisplays();

            // Property: For any display in the list, it must have complete metadata
            for (const display of displays) {
              // Must have valid bounds
              expect(display.bounds).toBeDefined();
              expect(typeof display.bounds.x).toBe('number');
              expect(typeof display.bounds.y).toBe('number');
              expect(typeof display.bounds.width).toBe('number');
              expect(typeof display.bounds.height).toBe('number');
              expect(display.bounds.width).toBeGreaterThan(0);
              expect(display.bounds.height).toBeGreaterThan(0);

              // Must have scale factor greater than 0
              expect(typeof display.scaleFactor).toBe('number');
              expect(display.scaleFactor).toBeGreaterThan(0);

              // Must have unique identifier
              expect(typeof display.id).toBe('number');
              expect(display.id).toBeGreaterThan(0);

              // Must have isPrimary flag
              expect(typeof display.isPrimary).toBe('boolean');
            }

            // Verify all IDs are unique
            const ids = displays.map(d => d.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);

            // Verify exactly one primary display
            const primaryCount = displays.filter(d => d.isPrimary).length;
            expect(primaryCount).toBe(1);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
