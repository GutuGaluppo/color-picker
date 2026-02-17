import { BrowserWindow, screen } from "electron";
import path from "path";

interface WindowState {
  exploreVisible: boolean;
  captureActive: boolean;
  previousExploreState: boolean;
}

let windowState: WindowState = {
  exploreVisible: false,
  captureActive: false,
  previousExploreState: false
};
let exploreWindow: BrowserWindow | null = null;
let captureWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

export function createExploreWindow(): BrowserWindow {
  if (exploreWindow && !exploreWindow.isDestroyed()) {
    exploreWindow.show();
    return exploreWindow;
  }

  exploreWindow = new BrowserWindow({
    width: 400,
    height: 400,
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

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  captureWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
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
