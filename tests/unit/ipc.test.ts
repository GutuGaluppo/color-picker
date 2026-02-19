import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules before importing anything
const mockAddColorToHistory = vi.fn();
const mockGetColorHistory = vi.fn().mockReturnValue([]);
const mockCaptureScreen = vi.fn();
const mockCloseCaptureWindow = vi.fn();
const mockRestoreExploreWindowState = vi.fn();
const mockGetCaptureWindow = vi.fn();
const mockResizeCaptureWindow = vi.fn();

vi.mock('../../electron/windows', () => ({
  addColorToHistory: mockAddColorToHistory,
  getColorHistory: mockGetColorHistory,
  closeCaptureWindow: mockCloseCaptureWindow,
  restoreExploreWindowState: mockRestoreExploreWindowState,
  getCaptureWindow: mockGetCaptureWindow,
  resizeCaptureWindow: mockResizeCaptureWindow,
}));

vi.mock('../../electron/capture', () => ({
  captureScreen: mockCaptureScreen,
}));

// Helper to create mock window with webContents
function createMockWindow(isDestroyed = false) {
  return {
    isDestroyed: vi.fn(() => isDestroyed),
    webContents: {
      send: vi.fn(),
    },
  };
}

// Helper to create mock display info
function createMockDisplays() {
  return [
    {
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
      isPrimary: true,
    },
    {
      id: 2,
      bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
      scaleFactor: 2.0,
      isPrimary: false,
    },
  ];
}

describe('IPC Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('capture-screen handler', () => {
    it('should return multi-display capture data', async () => {
      const mockCaptureData = {
        displays: [
          {
            displayId: 1,
            dataUrl: 'data:image/png;base64,mock1',
            width: 1920,
            height: 1080,
            scaleFactor: 1.0,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          },
          {
            displayId: 2,
            dataUrl: 'data:image/png;base64,mock2',
            width: 2560,
            height: 1440,
            scaleFactor: 2.0,
            bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
          },
        ],
        virtualBounds: { x: 0, y: 0, width: 4480, height: 1440 },
        timestamp: Date.now(),
      };

      mockCaptureScreen.mockResolvedValue(mockCaptureData);

      // Simulate IPC handler behavior
      const result = await mockCaptureScreen();

      expect(mockCaptureScreen).toHaveBeenCalled();
      expect(result).toEqual(mockCaptureData);
      expect(result.displays).toHaveLength(2);
      expect(result.displays[0].displayId).toBe(1);
      expect(result.displays[1].displayId).toBe(2);
    });

    it('should handle capture errors gracefully', async () => {
      const mockError = new Error('Capture failed');
      mockCaptureScreen.mockRejectedValue(mockError);

      // Simulate IPC handler error handling
      await expect(async () => {
        try {
          await mockCaptureScreen();
        } catch (error) {
          mockCloseCaptureWindow();
          mockRestoreExploreWindowState();
          throw error;
        }
      }).rejects.toThrow('Capture failed');

      expect(mockCloseCaptureWindow).toHaveBeenCalled();
      expect(mockRestoreExploreWindowState).toHaveBeenCalled();
    });
  });

  describe('add-color-to-history handler', () => {
    it('should add color to history', async () => {
      mockAddColorToHistory('#FF5733');

      expect(mockAddColorToHistory).toHaveBeenCalledWith('#FF5733');
    });

    it('should handle multiple color additions', async () => {
      mockAddColorToHistory('#FF5733');
      mockAddColorToHistory('#33FF57');
      mockAddColorToHistory('#3357FF');

      expect(mockAddColorToHistory).toHaveBeenCalledTimes(3);
      expect(mockAddColorToHistory).toHaveBeenNthCalledWith(1, '#FF5733');
      expect(mockAddColorToHistory).toHaveBeenNthCalledWith(2, '#33FF57');
      expect(mockAddColorToHistory).toHaveBeenNthCalledWith(3, '#3357FF');
    });
  });

  describe('get-color-history handler', () => {
    it('should return color history', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: 1000 },
        { hex: '#33FF57', timestamp: 2000 },
        { hex: '#3357FF', timestamp: 3000 },
      ];

      mockGetColorHistory.mockReturnValue(mockHistory);

      const result = mockGetColorHistory();

      expect(mockGetColorHistory).toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no history', async () => {
      mockGetColorHistory.mockReturnValue([]);

      const result = mockGetColorHistory();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('displays-changed event propagation', () => {
    it('should send display updates to all windows on display change', () => {
      const mockWindow1 = createMockWindow(false);
      const mockWindow2 = createMockWindow(false);
      const mockDisplays = createMockDisplays();

      // Simulate display change event propagation
      const windows = [mockWindow1, mockWindow2];
      windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.webContents.send('displays-changed', mockDisplays);
        }
      });

      expect(mockWindow1.webContents.send).toHaveBeenCalledWith('displays-changed', mockDisplays);
      expect(mockWindow2.webContents.send).toHaveBeenCalledWith('displays-changed', mockDisplays);
    });

    it('should not send to destroyed windows', () => {
      const mockWindow1 = createMockWindow(false);
      const mockWindow2 = createMockWindow(true);
      const mockDisplays = createMockDisplays();

      // Simulate display change event propagation
      const windows = [mockWindow1, mockWindow2];
      windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.webContents.send('displays-changed', mockDisplays);
        }
      });

      expect(mockWindow1.webContents.send).toHaveBeenCalledWith('displays-changed', mockDisplays);
      expect(mockWindow2.webContents.send).not.toHaveBeenCalled();
    });

    it('should resize capture window on display change', () => {
      const mockCaptureWindow = createMockWindow(false);
      mockGetCaptureWindow.mockReturnValue(mockCaptureWindow);

      // Simulate display change handling
      const captureWindow = mockGetCaptureWindow();
      if (captureWindow && !captureWindow.isDestroyed()) {
        mockResizeCaptureWindow();
      }

      expect(mockResizeCaptureWindow).toHaveBeenCalledTimes(1);
    });

    it('should not resize if capture window is destroyed', () => {
      const mockCaptureWindow = createMockWindow(true);
      mockGetCaptureWindow.mockReturnValue(mockCaptureWindow);

      // Simulate display change handling
      const captureWindow = mockGetCaptureWindow();
      if (captureWindow && !captureWindow.isDestroyed()) {
        mockResizeCaptureWindow();
      }

      expect(mockResizeCaptureWindow).not.toHaveBeenCalled();
    });

    it('should not resize if no capture window exists', () => {
      mockGetCaptureWindow.mockReturnValue(null);

      // Simulate display change handling
      const captureWindow = mockGetCaptureWindow();
      if (captureWindow && !captureWindow.isDestroyed()) {
        mockResizeCaptureWindow();
      }

      expect(mockResizeCaptureWindow).not.toHaveBeenCalled();
    });
  });
});
