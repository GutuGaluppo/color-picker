import { app, ipcMain, BrowserWindow } from 'electron';
import {
  createExploreWindow,
  createCaptureWindow,
  closeCaptureWindow,
  hideExploreWindow,
  showExploreWindow,
  restoreExploreWindowState,
  getExploreWindow,
  getCaptureWindow,
  addColorToHistory,
  getColorHistory,
  resizeCaptureWindow
} from './windows';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';
import { captureAllDisplays, copyToClipboard, invalidateCaptureCache, checkMemoryUsage } from './capture';
import { createTray, destroyTray } from './tray';
import { initializeDisplayListeners, cleanupDisplayListeners, DisplayInfo } from './displays';

// Memory check interval (every 30 seconds)
const MEMORY_CHECK_INTERVAL_MS = 30000;
let memoryCheckTimer: NodeJS.Timeout | null = null;

// Flag to track if app is quitting
let isAppQuitting = false;

export function isQuitting(): boolean {
  return isAppQuitting;
}

// Request single instance lock to prevent duplicate launches
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this instance
  app.quit();
} else {
  // Handle second instance launch attempts
  app.on('second-instance', () => {
    // Show and focus the explore window when user tries to launch again
    const exploreWindow = getExploreWindow();
    if (exploreWindow) {
      if (!exploreWindow.isVisible()) {
        showExploreWindow();
      }
      exploreWindow.focus();
    } else {
      createExploreWindow();
    }
  });

  app.whenReady().then(() => {
    console.log('[Main] App ready, initializing...');
    
    // Initialize display change listeners to invalidate capture cache
    initializeDisplayListeners((displays: DisplayInfo[]) => {
      console.log('[Main] Display configuration changed:', displays.length, 'displays');
      invalidateCaptureCache();
      
      // Resize capture window if active
      const captureWindow = getCaptureWindow();
      if (captureWindow && !captureWindow.isDestroyed()) {
        resizeCaptureWindow();
      }
      
      // Notify all renderer processes about display changes
      BrowserWindow.getAllWindows().forEach(window => {
        if (!window.isDestroyed()) {
          window.webContents.send('displays-changed', displays);
        }
      });
    });

    // Start periodic memory check
    memoryCheckTimer = setInterval(() => {
      checkMemoryUsage();
    }, MEMORY_CHECK_INTERVAL_MS);

    // Try to create system tray, fallback to showing window if it fails
    try {
      console.log('[Main] Creating system tray...');
      createTray();
      console.log('[Main] System tray created successfully');
    } catch (error) {
      console.error('Failed to create system tray:', error);
      console.warn('Continuing without system tray - limited functionality');
      // Show explore window as fallback when tray is unavailable
      // This ensures the app is still accessible even without tray support
    }
    
    console.log('[Main] Registering global shortcuts...');
    registerGlobalShortcuts();
    console.log('[Main] Creating explore window...');
    createExploreWindow();
    console.log('[Main] Initialization complete');

    app.on('activate', () => {
      console.log('[Main] App activated');
      createExploreWindow();
    });
  });
}

app.on('window-all-closed', () => {
  // Don't quit on any platform - app continues running in background with system tray
  // User must explicitly select "Quit" from the tray menu to terminate the application
});

app.on('will-quit', () => {
  unregisterGlobalShortcuts();
  cleanupDisplayListeners();
  
  // Clear memory check timer
  if (memoryCheckTimer) {
    clearInterval(memoryCheckTimer);
    memoryCheckTimer = null;
  }
});

app.on('before-quit', () => {
  isAppQuitting = true;
  destroyTray();
});

// IPC handlers
ipcMain.handle('capture-screen', async () => {
  try {
    const result = await captureAllDisplays();
    return result;
  } catch (error) {
    console.error('Screen capture failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    
    // Ensure capture window is closed on error
    closeCaptureWindow();
    
    // Restore explore window state so user can retry
    restoreExploreWindowState();
    
    throw error;
  }
});

ipcMain.handle('copy-to-clipboard', async (_event, text: string) => {
  copyToClipboard(text);
  return true;
});

ipcMain.on('close-capture', () => {
  closeCaptureWindow();
  restoreExploreWindowState();
});

ipcMain.on('start-capture', () => {
  // Don't hide explore window - it should remain visible as a floating control panel
  createCaptureWindow();
});

ipcMain.on('close-explore', () => {
  // Don't actually close, just hide
  hideExploreWindow();
});

ipcMain.on('cancel-capture', () => {
  closeCaptureWindow();
  restoreExploreWindowState();
});

ipcMain.on('quit-app', () => {
  isAppQuitting = true;
  app.quit();
});

ipcMain.handle('add-color-to-history', async (_event, hex: string) => {
  addColorToHistory(hex);
});

ipcMain.handle('get-color-history', async () => {
  return getColorHistory();
});