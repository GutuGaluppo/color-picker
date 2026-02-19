import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserWindow } from 'electron';

// Mock Electron modules
const mockBrowserWindow = vi.fn();
const mockLoadURL = vi.fn();
const mockLoadFile = vi.fn();
const mockShow = vi.fn();
const mockHide = vi.fn();
const mockFocus = vi.fn();
const mockClose = vi.fn();
const mockIsDestroyed = vi.fn(() => false);
const mockIsVisible = vi.fn(() => true);
const mockSetBounds = vi.fn();
const mockSetIgnoreMouseEvents = vi.fn();
const mockSetVisibleOnAllWorkspaces = vi.fn();
const mockOn = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: mockLoadURL,
    loadFile: mockLoadFile,
    show: mockShow,
    hide: mockHide,
    focus: mockFocus,
    close: mockClose,
    isDestroyed: mockIsDestroyed,
    isVisible: mockIsVisible,
    setBounds: mockSetBounds,
    setIgnoreMouseEvents: mockSetIgnoreMouseEvents,
    setVisibleOnAllWorkspaces: mockSetVisibleOnAllWorkspaces,
    on: mockOn
  })),
  screen: {
    getAllDisplays: vi.fn(),
    getPrimaryDisplay: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn()
  }
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/'))
  }
}));

// Mock displays module
vi.mock('../../electron/displays', () => ({
  getVirtualScreenBounds: vi.fn(() => ({
    x: 0,
    y: 0,
    width: 3840,
    height: 1080
  })),
  getAllDisplays: vi.fn(() => [
    {
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
      isPrimary: true
    },
    {
      id: 2,
      bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
      isPrimary: false
    }
  ])
}));

describe('Window Manager Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Capture Window', () => {
    it('should create capture window spanning virtual screen bounds', async () => {
      const { createCaptureWindow } = await import('../../electron/windows');
      const { getVirtualScreenBounds } = await import('../../electron/displays');

      const virtualBounds = getVirtualScreenBounds();
      const window = createCaptureWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: virtualBounds.width,
          height: virtualBounds.height,
          x: virtualBounds.x,
          y: virtualBounds.y
        })
      );
    });

    it('should create capture window with correct properties', async () => {
      const { createCaptureWindow } = await import('../../electron/windows');

      createCaptureWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          resizable: false,
          movable: false,
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          skipTaskbar: true,
          hasShadow: false,
          enableLargerThanScreen: true
        })
      );
    });

    it('should resize capture window when displays change', async () => {
      const { createCaptureWindow, resizeCaptureWindow } = await import('../../electron/windows');
      const { getVirtualScreenBounds } = await import('../../electron/displays');

      // Create initial window
      createCaptureWindow();

      // Mock new virtual bounds after display change
      const newBounds = { x: 0, y: 0, width: 5760, height: 1080 };
      vi.mocked(getVirtualScreenBounds).mockReturnValue(newBounds);

      // Resize window
      resizeCaptureWindow();

      expect(mockSetBounds).toHaveBeenCalledWith({
        x: newBounds.x,
        y: newBounds.y,
        width: newBounds.width,
        height: newBounds.height
      });
    });
  });

  describe('Explore Window', () => {
    it('should create explore window with correct properties', async () => {
      const { createExploreWindow } = await import('../../electron/windows');

      createExploreWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          height: 400,
          resizable: false,
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          skipTaskbar: true
        })
      );
    });

    it('should hide explore window instead of closing', async () => {
      const { createExploreWindow } = await import('../../electron/windows');

      createExploreWindow();

      // Get the close event handler
      const closeHandler = mockOn.mock.calls.find(call => call[0] === 'close')?.[1];
      expect(closeHandler).toBeDefined();

      // Simulate close event
      const mockEvent = { preventDefault: vi.fn() };
      closeHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockHide).toHaveBeenCalled();
    });

    it('should show explore window when requested', async () => {
      const { createExploreWindow, showExploreWindow } = await import('../../electron/windows');

      createExploreWindow();
      showExploreWindow();

      expect(mockShow).toHaveBeenCalled();
      expect(mockFocus).toHaveBeenCalled();
    });

    it('should hide explore window when requested', async () => {
      const { createExploreWindow, hideExploreWindow } = await import('../../electron/windows');

      createExploreWindow();
      hideExploreWindow();

      expect(mockHide).toHaveBeenCalled();
    });
  });

  describe('Color History', () => {
    it('should add color to history', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      clearColorHistory();
      
      const hex = '#FF5733';
      addColorToHistory(hex);

      const history = getColorHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].hex).toBe(hex);
      expect(history[0].timestamp).toBeGreaterThan(0);
    });

    it('should add multiple colors to history', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      clearColorHistory();
      
      const colors = ['#FF5733', '#33FF57', '#3357FF'];
      colors.forEach(color => addColorToHistory(color));

      const history = getColorHistory();
      
      expect(history).toHaveLength(3);
      expect(history.map(h => h.hex)).toEqual(colors.reverse()); // Most recent first
    });

    it('should maintain chronological order (most recent first)', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      clearColorHistory();
      
      const color1 = '#FF5733';
      const color2 = '#33FF57';
      
      addColorToHistory(color1);
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      addColorToHistory(color2);

      const history = getColorHistory();
      
      expect(history[0].hex).toBe(color2); // Most recent
      expect(history[1].hex).toBe(color1);
      expect(history[0].timestamp).toBeGreaterThanOrEqual(history[1].timestamp);
    });

    it('should retrieve color history', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      clearColorHistory();
      
      const colors = ['#FF5733', '#33FF57'];
      colors.forEach(color => addColorToHistory(color));

      const history = getColorHistory();
      
      expect(history).toHaveLength(2);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should clear color history', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      addColorToHistory('#FF5733');
      addColorToHistory('#33FF57');
      
      clearColorHistory();
      
      const history = getColorHistory();
      expect(history).toHaveLength(0);
    });

    it('should trim history to 1000 items when exceeded', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      clearColorHistory();
      
      // Add 1100 colors
      for (let i = 0; i < 1100; i++) {
        addColorToHistory(`#${i.toString(16).padStart(6, '0')}`);
      }

      const history = getColorHistory();
      
      expect(history).toHaveLength(1000);
      // Most recent 1000 should be kept
      expect(history[0].hex).toBe(`#${(1099).toString(16).padStart(6, '0')}`);
    });

    it('should return a copy of history array', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = 
        await import('../../electron/windows');

      clearColorHistory();
      addColorToHistory('#FF5733');

      const history1 = getColorHistory();
      const history2 = getColorHistory();
      
      // Should be different array instances
      expect(history1).not.toBe(history2);
      // But with same content
      expect(history1).toEqual(history2);
    });
  });

  describe('Window State Transitions', () => {
    it('should track explore window visibility', async () => {
      const { createExploreWindow, hideExploreWindow, showExploreWindow } = 
        await import('../../electron/windows');

      createExploreWindow();
      hideExploreWindow();
      showExploreWindow();

      expect(mockHide).toHaveBeenCalled();
      expect(mockShow).toHaveBeenCalled();
    });

    it('should restore previous explore window state', async () => {
      const { createExploreWindow, hideExploreWindow, restoreExploreWindowState } = 
        await import('../../electron/windows');

      createExploreWindow();
      mockIsVisible.mockReturnValue(true);
      hideExploreWindow();
      
      restoreExploreWindowState();

      expect(mockShow).toHaveBeenCalled();
    });

    it('should handle window already destroyed', async () => {
      const { createExploreWindow, showExploreWindow } = 
        await import('../../electron/windows');

      createExploreWindow();
      mockIsDestroyed.mockReturnValue(true);

      // Should not throw
      expect(() => showExploreWindow()).not.toThrow();
    });
  });
});
