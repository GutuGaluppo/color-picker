import { app, globalShortcut } from 'electron';
import { createCaptureWindow, hideExploreWindow } from './windows';

export function registerGlobalShortcuts(): void {
  const ret = globalShortcut.register('CommandOrControl+Shift+C', () => {
    hideExploreWindow();
    createCaptureWindow();
  });

  if (!ret) {
    console.error('Global shortcut registration failed');
  }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}
