import { app, ipcMain } from 'electron';
import { 
  createExploreWindow, 
  createCaptureWindow, 
  closeCaptureWindow,
  hideExploreWindow,
  showExploreWindow,
  restoreExploreWindowState,
  getExploreWindow
} from './windows';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';
import { captureScreen, copyToClipboard } from './capture';
import { createTray, destroyTray } from './tray';

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
    createTray();
    registerGlobalShortcuts();
    createExploreWindow();

    app.on('activate', () => {
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
});

app.on('before-quit', () => {
  destroyTray();
});

// IPC handlers
ipcMain.handle('capture-screen', async () => {
  try {
    const result = await captureScreen();
    return result;
  } catch (error) {
    console.error('Screen capture failed:', error);
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
  hideExploreWindow();
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
