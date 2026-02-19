import { screen, Display } from 'electron';

export interface DisplayInfo {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
}

export interface VirtualScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Cache for display list
let cachedDisplays: DisplayInfo[] | null = null;
let displayChangeCallback: ((displays: DisplayInfo[]) => void) | null = null;
let isListenerInitialized = false;
let retryTimer: NodeJS.Timeout | null = null;
const RETRY_INTERVAL_MS = 5000;

/**
 * Convert Electron Display to DisplayInfo
 * @param display - Electron Display object
 * @param primaryDisplayId - ID of primary display (cached for performance)
 */
function toDisplayInfo(display: Display, primaryDisplayId: number): DisplayInfo {
  return {
    id: display.id,
    bounds: {
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
    },
    scaleFactor: display.scaleFactor,
    isPrimary: display.id === primaryDisplayId,
  };
}

/**
 * Get all connected displays
 * Uses cache if available, otherwise fetches from system
 * Implements retry logic for detection failures
 */
export function getAllDisplays(): DisplayInfo[] {
  if (cachedDisplays !== null) {
    return cachedDisplays;
  }
  
  try {
    const displays = screen.getAllDisplays();
    
    if (displays.length === 0) {
      console.error('[Display Manager] No displays detected, falling back to primary display');
      const primaryDisplay = screen.getPrimaryDisplay();
      const primaryDisplayId = primaryDisplay.id;
      cachedDisplays = [toDisplayInfo(primaryDisplay, primaryDisplayId)];
      
      // Start retry timer to detect displays
      startRetryTimer();
      
      return cachedDisplays;
    }
    
    // Clear retry timer if displays detected successfully
    clearRetryTimer();
    
    const primaryDisplayId = screen.getPrimaryDisplay().id;
    cachedDisplays = displays.map(d => toDisplayInfo(d, primaryDisplayId));
    return cachedDisplays;
  } catch (error) {
    console.error('[Display Manager] Failed to get displays:', error);
    
    // Start retry timer
    startRetryTimer();
    
    // Return primary display as fallback
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const primaryDisplayId = primaryDisplay.id;
      cachedDisplays = [toDisplayInfo(primaryDisplay, primaryDisplayId)];
      return cachedDisplays;
    } catch (fallbackError) {
      console.error('[Display Manager] Failed to get primary display:', fallbackError);
      // Return empty array as last resort
      return [];
    }
  }
}

/**
 * Get display containing a point
 * Falls back to primary display if point is outside all displays
 */
export function getDisplayAtPoint(x: number, y: number): DisplayInfo | null {
  try {
    const display = screen.getDisplayNearestPoint({ x, y });
    
    if (!display) {
      console.warn(`[Display Manager] No display found at point (${x}, ${y}), falling back to primary`);
      return toDisplayInfo(screen.getPrimaryDisplay(), screen.getPrimaryDisplay().id);
    }
    
    const primaryDisplayId = screen.getPrimaryDisplay().id;
    return toDisplayInfo(display, primaryDisplayId);
  } catch (error) {
    console.error(`[Display Manager] Error getting display at point (${x}, ${y}):`, error);
    return null;
  }
}

/**
 * Get virtual screen bounds (all displays combined)
 */
export function getVirtualScreenBounds(): VirtualScreenBounds {
  const displays = getAllDisplays();
  
  if (displays.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const display of displays) {
    minX = Math.min(minX, display.bounds.x);
    minY = Math.min(minY, display.bounds.y);
    maxX = Math.max(maxX, display.bounds.x + display.bounds.width);
    maxY = Math.max(maxY, display.bounds.y + display.bounds.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Handle display change events
 * Handles display disconnection during capture
 */
function handleDisplayChange(): void {
  // Invalidate cache
  cachedDisplays = null;
  
  const displays = getAllDisplays();
  
  if (displays.length === 0) {
    console.error('[Display Manager] All displays disconnected');
  }
  
  if (displayChangeCallback) {
    displayChangeCallback(displays);
  }
}

/**
 * Start retry timer for display detection
 */
function startRetryTimer(): void {
  if (retryTimer !== null) {
    return; // Timer already running
  }
  
  console.log('[Display Manager] Starting retry timer for display detection');
  retryTimer = setInterval(() => {
    console.log('[Display Manager] Retrying display detection...');
    cachedDisplays = null; // Invalidate cache to force re-detection
    const displays = getAllDisplays();
    
    if (displays.length > 1 || (displays.length === 1 && displays[0].bounds.width > 0)) {
      console.log('[Display Manager] Display detection successful, stopping retry timer');
      clearRetryTimer();
      
      // Notify callback of successful detection
      if (displayChangeCallback) {
        displayChangeCallback(displays);
      }
    }
  }, RETRY_INTERVAL_MS);
}

/**
 * Clear retry timer
 */
function clearRetryTimer(): void {
  if (retryTimer !== null) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

/**
 * Initialize display change listeners
 * Safe to call multiple times - will cleanup previous listeners first
 */
export function initializeDisplayListeners(
  onChange: (displays: DisplayInfo[]) => void
): void {
  // Cleanup any existing listeners to prevent duplicates
  if (isListenerInitialized) {
    cleanupDisplayListeners();
  }
  
  displayChangeCallback = onChange;
  
  // Listen to display events
  screen.on('display-added', handleDisplayChange);
  screen.on('display-removed', handleDisplayChange);
  screen.on('display-metrics-changed', handleDisplayChange);
  
  isListenerInitialized = true;
  
  // Initialize cache
  getAllDisplays();
}

/**
 * Cleanup display listeners
 */
export function cleanupDisplayListeners(): void {
  screen.removeListener('display-added', handleDisplayChange);
  screen.removeListener('display-removed', handleDisplayChange);
  screen.removeListener('display-metrics-changed', handleDisplayChange);
  
  clearRetryTimer();
  displayChangeCallback = null;
  cachedDisplays = null;
  isListenerInitialized = false;
}
