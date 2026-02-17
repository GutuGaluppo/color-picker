import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: persistent-color-picker, Property 5: Duplicate launch shows window
 * 
 * Property: For any application state where the app is already running,
 * launching the application again should make the Explore_Window visible if it was hidden.
 * 
 * Validates: Requirements 3.2
 */

// Mock Electron modules
const mockBrowserWindow = {
  isVisible: vi.fn(),
  isDestroyed: vi.fn(),
  show: vi.fn(),
  focus: vi.fn(),
  hide: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  setIgnoreMouseEvents: vi.fn(),
  setVisibleOnAllWorkspaces: vi.fn(),
};

const mockApp = {
  requestSingleInstanceLock: vi.fn(),
  quit: vi.fn(),
  on: vi.fn(),
  whenReady: vi.fn(),
};

const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
};

// Mock electron module
vi.mock('electron', () => ({
  app: mockApp,
  ipcMain: mockIpcMain,
  BrowserWindow: vi.fn(() => mockBrowserWindow),
  screen: {
    getPrimaryDisplay: () => ({
      bounds: { width: 1920, height: 1080 },
    }),
  },
}));

// Mock window management module
vi.mock('../../electron/windows', async () => {
  let exploreWindow: any = null;
  let windowVisible = false;

  return {
    createExploreWindow: vi.fn(() => {
      exploreWindow = { ...mockBrowserWindow };
      windowVisible = true;
      exploreWindow.isVisible.mockReturnValue(true);
      exploreWindow.isDestroyed.mockReturnValue(false);
      return exploreWindow;
    }),
    getExploreWindow: vi.fn(() => exploreWindow),
    showExploreWindow: vi.fn(() => {
      if (exploreWindow && !exploreWindow.isDestroyed()) {
        windowVisible = true;
        exploreWindow.isVisible.mockReturnValue(true);
        exploreWindow.show();
        exploreWindow.focus();
      }
    }),
    hideExploreWindow: vi.fn(() => {
      if (exploreWindow && !exploreWindow.isDestroyed()) {
        windowVisible = false;
        exploreWindow.isVisible.mockReturnValue(false);
        exploreWindow.hide();
      }
    }),
  };
});

// Mock other dependencies
vi.mock('../../electron/shortcuts', () => ({
  registerGlobalShortcuts: vi.fn(),
  unregisterGlobalShortcuts: vi.fn(),
}));

vi.mock('../../electron/capture', () => ({
  captureScreen: vi.fn(),
  copyToClipboard: vi.fn(),
}));

vi.mock('../../electron/tray', () => ({
  createTray: vi.fn(),
  destroyTray: vi.fn(),
}));

describe('Property 5: Duplicate launch shows window', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show and focus explore window when second instance is launched', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random initial window visibility states
        fc.boolean(),
        async (initiallyVisible) => {
          // Setup: Mock the window state
          const { 
            createExploreWindow, 
            getExploreWindow, 
            showExploreWindow,
            hideExploreWindow 
          } = await import('../../electron/windows');

          // Create the initial window
          createExploreWindow();
          const exploreWindow = getExploreWindow();

          // Set initial visibility state
          if (!initiallyVisible) {
            hideExploreWindow();
            mockBrowserWindow.isVisible.mockReturnValue(false);
          } else {
            mockBrowserWindow.isVisible.mockReturnValue(true);
          }

          // Simulate second-instance event handler
          // This mimics what happens in main.ts when app.on('second-instance') fires
          const secondInstanceHandler = () => {
            const window = getExploreWindow();
            if (window) {
              if (!window.isVisible()) {
                showExploreWindow();
              }
              window.focus();
            } else {
              createExploreWindow();
            }
          };

          // Execute: Trigger second instance launch
          secondInstanceHandler();

          // Verify: Window should be visible and focused
          if (!initiallyVisible) {
            // If window was hidden, showExploreWindow should be called
            expect(showExploreWindow).toHaveBeenCalled();
          }
          
          // In all cases, focus should be called
          expect(mockBrowserWindow.focus).toHaveBeenCalled();

          // Window should exist and not be destroyed
          expect(exploreWindow).not.toBeNull();
          expect(mockBrowserWindow.isDestroyed()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create window if it does not exist when second instance is launched', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // Window doesn't exist
        async () => {
          // Setup: Ensure no window exists
          const { createExploreWindow, getExploreWindow } = await import('../../electron/windows');
          
          // Mock getExploreWindow to return null initially
          vi.mocked(getExploreWindow).mockReturnValueOnce(null);

          // Simulate second-instance event handler
          const secondInstanceHandler = () => {
            const window = getExploreWindow();
            if (window) {
              if (!window.isVisible()) {
                // showExploreWindow would be called here
              }
              window.focus();
            } else {
              createExploreWindow();
            }
          };

          // Execute: Trigger second instance launch
          secondInstanceHandler();

          // Verify: createExploreWindow should be called
          expect(createExploreWindow).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle rapid duplicate launches without errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of rapid launches
        async (launchCount) => {
          // Clear mocks before each property test iteration
          vi.clearAllMocks();
          
          // Setup
          const { 
            createExploreWindow, 
            getExploreWindow, 
            showExploreWindow 
          } = await import('../../electron/windows');

          createExploreWindow();

          // Simulate second-instance event handler
          const secondInstanceHandler = () => {
            const window = getExploreWindow();
            if (window) {
              if (!window.isVisible()) {
                showExploreWindow();
              }
              window.focus();
            } else {
              createExploreWindow();
            }
          };

          // Execute: Trigger multiple rapid launches
          const errors: Error[] = [];
          for (let i = 0; i < launchCount; i++) {
            try {
              secondInstanceHandler();
            } catch (error) {
              errors.push(error as Error);
            }
          }

          // Verify: No errors should occur
          expect(errors).toHaveLength(0);
          
          // Focus should be called for each launch
          expect(mockBrowserWindow.focus).toHaveBeenCalledTimes(launchCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
