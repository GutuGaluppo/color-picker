import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { hideExploreWindow, createCaptureWindow, showExploreWindow } from './windows';

let tray: Tray | null = null;

/**
 * Get platform-specific icon path for system tray
 */
function getTrayIconPath(): string {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS uses Template images for menu bar icons
    return path.join(__dirname, 'assets/tray-icon-mac.png');
  } else if (platform === 'win32') {
    // Windows uses .ico files
    return path.join(__dirname, 'assets/tray-icon-win.ico');
  } else {
    // Linux uses PNG
    return path.join(__dirname, 'assets/tray-icon-linux.png');
  }
}

/**
 * Handler for Start Capture menu item
 * Hides the explore window and creates the capture window
 */
function handleStartCapture(): void {
  hideExploreWindow();
  createCaptureWindow();
}

/**
 * Handler for Show Window menu item
 * Shows the explore window
 */
function handleShowWindow(): void {
  showExploreWindow();
}

/**
 * Handler for Quit menu item
 * Quits the application completely
 */
function handleQuit(): void {
  app.quit();
}

/**
 * Build the context menu for the system tray
 */
function buildTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Start Capture',
      click: handleStartCapture,
    },
    {
      label: 'Show Window',
      click: handleShowWindow,
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      click: handleQuit,
    },
  ]);
}

/**
 * Create the system tray icon with context menu
 * @returns The created Tray instance
 */
export function createTray(): Tray {
  const iconPath = getTrayIconPath();
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);
  tray.setToolTip('Color Picker');
  
  const contextMenu = buildTrayMenu();
  tray.setContextMenu(contextMenu);
  
  return tray;
}

/**
 * Destroy the system tray icon and cleanup resources
 */
export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
}

/**
 * Get the current tray instance
 * @returns The Tray instance or null if not created
 */
export function getTray(): Tray | null {
  return tray;
}
