import { BrowserWindow, screen } from "electron";
import path from "path";
import { getVirtualScreenBounds } from "./displays";

export interface ColorHistoryItem {
  hex: string;
  timestamp: number;
}

interface WindowState {
  exploreVisible: boolean;
  captureActive: boolean;
  previousExploreState: boolean;
  colorHistory: ColorHistoryItem[];
}

const MAX_HISTORY_ITEMS = 1000;

let windowState: WindowState = {
  exploreVisible: false,
  captureActive: false,
  previousExploreState: false,
  colorHistory: []
};
let exploreWindow: BrowserWindow | null = null;
let captureWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

export function createExploreWindow(): BrowserWindow {
  if (exploreWindow && !exploreWindow.isDestroyed()) {
    exploreWindow.show();
    return exploreWindow;
  }

  // Get primary display to center the window
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const windowWidth = 400;
  const windowHeight = 400;

  exploreWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.floor((screenWidth - windowWidth) / 2),
    y: Math.floor((screenHeight - windowHeight) / 2),
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Set window level to floating to ensure it stays above capture window
  exploreWindow.setAlwaysOnTop(true, 'floating');

  if (VITE_DEV_SERVER_URL) {
    exploreWindow.loadURL(`${VITE_DEV_SERVER_URL}#/explore`);
  } else {
    exploreWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/explore",
    });
  }

  // Handle window close event - hide instead of destroying
  exploreWindow.on("close", (event) => {
    event.preventDefault();
    exploreWindow?.hide();
    windowState.exploreVisible = false;
  });

  exploreWindow.on("closed", () => {
    exploreWindow = null;
  });

  windowState.exploreVisible = true;

  return exploreWindow;
}

export function createCaptureWindow(): BrowserWindow {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.show();
    return captureWindow;
  }

  // Use virtual screen bounds to span all displays
  const virtualBounds = getVirtualScreenBounds();

  captureWindow = new BrowserWindow({
    width: virtualBounds.width,
    height: virtualBounds.height,
    x: virtualBounds.x,
    y: virtualBounds.y,
    resizable: false,
    movable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false, // ADD this
    enableLargerThanScreen: true, // ADD this for macOS
    webPreferences: {
      preload: path.join(__dirname, "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  captureWindow.setIgnoreMouseEvents(false);
  captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); // ADD this
  captureWindow.setAlwaysOnTop(true, 'screen-saver'); // Lower level than explore window

  if (VITE_DEV_SERVER_URL) {
    captureWindow.loadURL(`${VITE_DEV_SERVER_URL}#/capture`);
  } else {
    captureWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/capture",
    });
  }

  captureWindow.on("closed", () => {
    captureWindow = null;
  });

  return captureWindow;
}

export function closeExploreWindow(): void {
  if (exploreWindow && !exploreWindow.isDestroyed()) {
    exploreWindow.close();
  }
}

export function closeCaptureWindow(): void {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.close();
  }
}

export function getExploreWindow(): BrowserWindow | null {
  return exploreWindow;
}

export function getCaptureWindow(): BrowserWindow | null {
  return captureWindow;
}

export function hideExploreWindow(): void {
  if (exploreWindow && !exploreWindow.isDestroyed()) {
    windowState.previousExploreState = exploreWindow.isVisible();
    exploreWindow.hide();
    windowState.exploreVisible = false;
  }
}

export function showExploreWindow(): void {
  if (exploreWindow && !exploreWindow.isDestroyed()) {
    exploreWindow.show();
    exploreWindow.focus();
    windowState.exploreVisible = true;
  } else {
    createExploreWindow();
    windowState.exploreVisible = true;
  }
}
export function restoreExploreWindowState(): void {
  if (windowState.previousExploreState) {
    showExploreWindow();
  }
}

/**
 * Add a color to the history
 * Automatically trims to last 1000 items if exceeded
 */
export function addColorToHistory(hex: string): void {
  const historyItem: ColorHistoryItem = {
    hex,
    timestamp: Date.now()
  };
  
  // Add to beginning of array (most recent first)
  windowState.colorHistory.unshift(historyItem);
  
  // Trim to last 1000 items if exceeded
  if (windowState.colorHistory.length > MAX_HISTORY_ITEMS) {
    console.log(`[Window Manager] History exceeded ${MAX_HISTORY_ITEMS} items, trimming to limit`);
    windowState.colorHistory = windowState.colorHistory.slice(0, MAX_HISTORY_ITEMS);
  }
  
  // Notify Explore window of history update
  if (exploreWindow && !exploreWindow.isDestroyed()) {
    exploreWindow.webContents.send('history-updated', windowState.colorHistory);
  }
}

/**
 * Get the color history
 */
export function getColorHistory(): ColorHistoryItem[] {
  return [...windowState.colorHistory];
}

/**
 * Clear the color history
 */
export function clearColorHistory(): void {
  windowState.colorHistory = [];
}

/**
 * Resize capture window to match current virtual screen bounds
 * Called when displays are added/removed during capture
 */
export function resizeCaptureWindow(): void {
  if (captureWindow && !captureWindow.isDestroyed()) {
    const virtualBounds = getVirtualScreenBounds();
    captureWindow.setBounds({
      x: virtualBounds.x,
      y: virtualBounds.y,
      width: virtualBounds.width,
      height: virtualBounds.height
    });
  }
}
