import { app, globalShortcut } from 'electron';
import { createCaptureWindow, hideExploreWindow } from './windows';

export function registerGlobalShortcuts(): void {
  const ret = globalShortcut.register('CommandOrControl+Shift+C', () => {
    hideExploreWindow();
    createCaptureWindow();
  });

  if (!ret) {
    console.warn('Global shortcut registration failed - shortcut may already be in use by another application');
    console.warn('Application will continue without global shortcut - use UI or system tray to start capture');
  }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}
