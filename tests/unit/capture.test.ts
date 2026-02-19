import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { desktopCapturer, clipboard } from 'electron';
import {
  captureAllDisplays,
  captureDisplay,
  copyToClipboard,
  invalidateCaptureCache,
  DisplayCapture,
  MultiDisplayCapture,
} from '../../electron/capture';
import * as displays from '../../electron/displays';

describe('Screen Capture Module - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCaptureCache();
  });

  afterEach(() => {
    invalidateCaptureCache();
  });

  describe('captureAllDisplays', () => {
    it('should capture primary display', async () => {
      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,primaryDisplay'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Primary Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      const result = await captureAllDisplays();

      expect(result.displays).toHaveLength(1);
      expect(result.displays[0].displayId).toBe(1);
      expect(result.displays[0].width).toBe(1920);
      expect(result.displays[0].height).toBe(1080);
      expect(result.displays[0].scaleFactor).toBe(1.0);
      expect(result.displays[0].dataUrl).toBe('data:image/png;base64,primaryDisplay');
    });

    it('should capture secondary display', async () => {
      const mockDisplays: displays.DisplayInfo[] = [
        {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: true,
        },
        {
          id: 2,
          bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
          scaleFactor: 1.0,
          isPrimary: false,
        },
      ];

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue(mockDisplays);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 4480,
        height: 1440,
      });

      const mockThumbnail1 = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,display1'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      const mockThumbnail2 = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,display2'),
        getSize: vi.fn().mockReturnValue({ width: 2560, height: 1440 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Display 1',
          thumbnail: mockThumbnail1 as any,
          display_id: '1',
          appIcon: null,
        } as any,
        {
          id: 'screen:2',
          name: 'Display 2',
          thumbnail: mockThumbnail2 as any,
          display_id: '2',
          appIcon: null,
        } as any,
      ]);

      const result = await captureAllDisplays();

      expect(result.displays).toHaveLength(2);
      expect(result.displays[0].displayId).toBe(1);
      expect(result.displays[1].displayId).toBe(2);
      expect(result.displays[1].width).toBe(2560);
      expect(result.displays[1].height).toBe(1440);
    });

    it('should capture all displays in multi-monitor setup', async () => {
      const mockDisplays: displays.DisplayInfo[] = [
        {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: true,
        },
        {
          id: 2,
          bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: false,
        },
        {
          id: 3,
          bounds: { x: 3840, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: false,
        },
      ];

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue(mockDisplays);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 5760,
        height: 1080,
      });

      const mockSources = mockDisplays.map((display, index) => ({
        id: `screen:${display.id}`,
        name: `Display ${index + 1}`,
        thumbnail: {
          toDataURL: vi.fn().mockReturnValue(`data:image/png;base64,display${index + 1}`),
          getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
        } as any,
        display_id: String(display.id),
        appIcon: null,
      }));

      vi.mocked(desktopCapturer.getSources).mockResolvedValue(mockSources as any);

      const result = await captureAllDisplays();

      expect(result.displays).toHaveLength(3);
      expect(result.virtualBounds.width).toBe(5760);
      expect(result.virtualBounds.height).toBe(1080);
    });

    it('should handle scale factor 2x (retina)', async () => {
      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 2.0,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,retina'),
        getSize: vi.fn().mockReturnValue({ width: 3840, height: 2160 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Retina Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      const result = await captureAllDisplays();

      expect(result.displays[0].width).toBe(3840);
      expect(result.displays[0].height).toBe(2160);
      expect(result.displays[0].scaleFactor).toBe(2.0);
    });

    it('should handle scale factor 1.5x', async () => {
      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 2560, height: 1440 },
        scaleFactor: 1.5,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 2560,
        height: 1440,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,scaled'),
        getSize: vi.fn().mockReturnValue({ width: 3840, height: 2160 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Scaled Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      const result = await captureAllDisplays();

      expect(result.displays[0].width).toBe(3840);
      expect(result.displays[0].height).toBe(2160);
      expect(result.displays[0].scaleFactor).toBe(1.5);
    });

    it('should use cache for subsequent calls within 100ms', async () => {
      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,cached'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      // First call
      const result1 = await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(1);

      // Second call within 100ms should use cache
      const result2 = await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(result2.timestamp).toBe(result1.timestamp);
    });

    it('should invalidate cache after 100ms', async () => {
      vi.useFakeTimers();

      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,fresh'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      // First call
      await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(1);

      // Advance time by 101ms
      vi.advanceTimersByTime(101);

      // Second call should not use cache
      await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should throw error when no sources available', async () => {
      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([
        {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: true,
        },
      ]);

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([]);

      await expect(captureAllDisplays()).rejects.toThrow('No screen sources available');
    });

    it('should throw error when no sources match displays', async () => {
      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      // Return source with completely different dimensions
      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,wrong'),
        getSize: vi.fn().mockReturnValue({ width: 800, height: 600 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Wrong Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      await expect(captureAllDisplays()).rejects.toThrow(
        'Could not match any capture sources to displays'
      );
    });
  });

  describe('captureDisplay', () => {
    it('should capture specific display by ID', async () => {
      const mockDisplays: displays.DisplayInfo[] = [
        {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: true,
        },
        {
          id: 2,
          bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
          scaleFactor: 1.0,
          isPrimary: false,
        },
      ];

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue(mockDisplays);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 4480,
        height: 1440,
      });

      const mockThumbnail1 = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,display1'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      const mockThumbnail2 = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,display2'),
        getSize: vi.fn().mockReturnValue({ width: 2560, height: 1440 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Display 1',
          thumbnail: mockThumbnail1 as any,
          display_id: '1',
          appIcon: null,
        } as any,
        {
          id: 'screen:2',
          name: 'Display 2',
          thumbnail: mockThumbnail2 as any,
          display_id: '2',
          appIcon: null,
        } as any,
      ]);

      const result = await captureDisplay(2);

      expect(result.displayId).toBe(2);
      expect(result.width).toBe(2560);
      expect(result.height).toBe(1440);
      expect(result.dataUrl).toBe('data:image/png;base64,display2');
    });

    it('should fallback to primary display when display not found', async () => {
      const mockDisplays: displays.DisplayInfo[] = [
        {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          isPrimary: true,
        },
      ];

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue(mockDisplays);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,primary'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Primary',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      // Request non-existent display ID 99
      const result = await captureDisplay(99);

      // Should return primary display
      expect(result.displayId).toBe(1);
      expect(result.dataUrl).toBe('data:image/png;base64,primary');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', () => {
      const testText = '#FF5733';
      copyToClipboard(testText);

      expect(clipboard.writeText).toHaveBeenCalledWith(testText);
      expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateCaptureCache', () => {
    it('should clear cache', async () => {
      const mockDisplay: displays.DisplayInfo = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        isPrimary: true,
      };

      vi.spyOn(displays, 'getAllDisplays').mockReturnValue([mockDisplay]);
      vi.spyOn(displays, 'getVirtualScreenBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      });

      const mockThumbnail = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
        getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      };

      vi.mocked(desktopCapturer.getSources).mockResolvedValue([
        {
          id: 'screen:1',
          name: 'Display',
          thumbnail: mockThumbnail as any,
          display_id: '1',
          appIcon: null,
        } as any,
      ]);

      // First call
      await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(1);

      // Invalidate cache
      invalidateCaptureCache();

      // Third call should not use cache
      await captureAllDisplays();
      expect(desktopCapturer.getSources).toHaveBeenCalledTimes(2);
    });
  });
});
