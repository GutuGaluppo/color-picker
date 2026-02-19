import { desktopCapturer, screen, clipboard } from 'electron';
import { getAllDisplays, getVirtualScreenBounds, DisplayInfo, VirtualScreenBounds } from './displays';

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
}

export interface DisplayCapture {
  displayId: number;
  dataUrl: string;
  width: number;
  height: number;
  scaleFactor: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MultiDisplayCapture {
  displays: DisplayCapture[];
  virtualBounds: VirtualScreenBounds;
  timestamp: number;
}

// Cache for captures
interface CaptureCache {
  data: MultiDisplayCapture;
  timestamp: number;
}

let captureCache: CaptureCache | null = null;
const CACHE_DURATION_MS = 100;

export async function captureScreen(): Promise<CaptureResult> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  });

  if (sources.length === 0) {
    throw new Error('No screen sources available');
  }

  const dataUrl = sources[0].thumbnail.toDataURL();
  
  return {
    dataUrl,
    width,
    height
  };
}

/**
 * Capture all connected displays
 * Returns capture data for each display with metadata
 * Uses cache to avoid redundant captures within 100ms
 */
export async function captureAllDisplays(): Promise<MultiDisplayCapture> {
  // Check cache
  const now = Date.now();
  if (captureCache && (now - captureCache.timestamp) < CACHE_DURATION_MS) {
    return captureCache.data;
  }

  const displays = getAllDisplays();
  const virtualBounds = getVirtualScreenBounds();

  // Get all screen sources
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 0, height: 0 } // Request native resolution
  });

  if (sources.length === 0) {
    throw new Error('No screen sources available');
  }

  // Match sources to displays by dimensions
  const displayCaptures: DisplayCapture[] = [];

  for (const display of displays) {
    const expectedWidth = Math.round(display.bounds.width * display.scaleFactor);
    const expectedHeight = Math.round(display.bounds.height * display.scaleFactor);

    // Find matching source with tolerance for rounding differences
    const tolerance = 10;
    const matchingSource = sources.find(source => {
      const widthMatch = Math.abs(source.thumbnail.getSize().width - expectedWidth) <= tolerance;
      const heightMatch = Math.abs(source.thumbnail.getSize().height - expectedHeight) <= tolerance;
      return widthMatch && heightMatch;
    });

    if (matchingSource) {
      const thumbnail = matchingSource.thumbnail;
      displayCaptures.push({
        displayId: display.id,
        dataUrl: thumbnail.toDataURL(),
        width: thumbnail.getSize().width,
        height: thumbnail.getSize().height,
        scaleFactor: display.scaleFactor,
        bounds: display.bounds,
      });
    } else {
      console.warn(`[Screen Capture] Could not match source for display ${display.id} (expected ${expectedWidth}x${expectedHeight})`);
    }
  }

  if (displayCaptures.length === 0) {
    throw new Error('Could not match any capture sources to displays');
  }

  const result: MultiDisplayCapture = {
    displays: displayCaptures,
    virtualBounds,
    timestamp: now,
  };

  // Update cache
  captureCache = {
    data: result,
    timestamp: now,
  };

  return result;
}

/**
 * Capture a specific display by ID
 * Falls back to primary display if display not found
 */
export async function captureDisplay(displayId: number): Promise<DisplayCapture> {
  const allCaptures = await captureAllDisplays();
  
  const displayCapture = allCaptures.displays.find(d => d.displayId === displayId);
  
  if (!displayCapture) {
    console.warn(`[Screen Capture] Display ${displayId} not found, falling back to primary`);
    const primaryCapture = allCaptures.displays.find(d => {
      const displays = getAllDisplays();
      const primaryDisplay = displays.find(disp => disp.isPrimary);
      return primaryDisplay && d.displayId === primaryDisplay.id;
    });
    
    if (!primaryCapture) {
      throw new Error('Could not capture primary display');
    }
    
    return primaryCapture;
  }
  
  return displayCapture;
}

/**
 * Invalidate capture cache
 * Should be called when displays change
 */
export function invalidateCaptureCache(): void {
  captureCache = null;
}

export function copyToClipboard(text: string): void {
  clipboard.writeText(text);
}
