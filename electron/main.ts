import { app, ipcMain } from 'electron';
import { 
  createExploreWindow, 
  createCaptureWindow, 
  closeCaptureWindow,
  hideExploreWindow,
  showExploreWindow 
} from './windows';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';
import { captureScreen, copyToClipboard } from './capture';
import { createTray, destroyTray } from './tray';

app.whenReady().then(() => {
  createTray();
  registerGlobalShortcuts();
  createExploreWindow();

  app.on('activate', () => {
    createExploreWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit - keep running in background
  }
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
  showExploreWindow();
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
  showExploreWindow();
});
