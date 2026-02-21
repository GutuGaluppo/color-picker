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
const CAPTURE_TIMEOUT_MS = 5000;
const DIMENSION_TOLERANCE = 10;
const MEMORY_LIMIT_BYTES = 150 * 1024 * 1024; // 150MB

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
 * Implements timeout and error handling
 */
export async function captureAllDisplays(): Promise<MultiDisplayCapture> {
  // Check cache
  const now = Date.now();
  if (captureCache && (now - captureCache.timestamp) < CACHE_DURATION_MS) {
    return captureCache.data;
  }

  const displays = getAllDisplays();
  const virtualBounds = getVirtualScreenBounds();

  // Calculate maximum dimensions needed for capture
  // We need to capture at physical pixel resolution (logical * scaleFactor)
  const maxWidth = Math.max(...displays.map(d => Math.round(d.bounds.width * d.scaleFactor)));
  const maxHeight = Math.max(...displays.map(d => Math.round(d.bounds.height * d.scaleFactor)));

  // Implement timeout for capture
  const capturePromise = desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: maxWidth, height: maxHeight }
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Screen capture timeout')), CAPTURE_TIMEOUT_MS);
  });

  let sources;
  try {
    sources = await Promise.race([capturePromise, timeoutPromise]);
  } catch (error) {
    console.error('[Screen Capture] Failed to get sources:', error);
    throw new Error(`Screen capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (sources.length === 0) {
    console.error('[Screen Capture] No screen sources available');
    throw new Error('No screen sources available');
  }

  // Match sources to displays by index (Screen 1 -> Display 1, Screen 2 -> Display 2)
  // This is more reliable than dimension matching which can fail due to scaling issues
  const displayCaptures: DisplayCapture[] = [];

  console.log('[Screen Capture] Displays detected:', displays.length);
  console.log('[Screen Capture] Sources available:', sources.length);
  displays.forEach((d, i) => {
    console.log(`[Screen Capture] Display ${i}: id=${d.id}, bounds=${JSON.stringify(d.bounds)}, scaleFactor=${d.scaleFactor}, isPrimary=${d.isPrimary}`);
  });
  sources.forEach((s, i) => {
    console.log(`[Screen Capture] Source ${i}: name="${s.name}", size=${s.thumbnail.getSize().width}x${s.thumbnail.getSize().height}`);
  });

  // Pre-sort sources by the trailing number in their name ("Screen 1" < "Screen 2").
  // On macOS "Screen 1" is the primary display; this order matches the order in
  // which we'll assign displays (primary first).
  const sortedSources = [...sources].sort((a, b) => {
    const aNum = parseInt(a.name.match(/\d+/)?.[0] ?? '999');
    const bNum = parseInt(b.name.match(/\d+/)?.[0] ?? '999');
    return aNum - bNum;
  });

  // Primary display first, then the rest in the order getAllDisplays() returned them.
  const primaryId = screen.getPrimaryDisplay().id;
  const sortedDisplayIds = [
    primaryId,
    ...displays.filter(d => d.id !== primaryId).map(d => d.id),
  ];

  for (let i = 0; i < displays.length; i++) {
    const display = displays[i];

    // Method 1: parse the CGDirectDisplayID embedded in the source id
    // (Electron formats it as "screen:DISPLAY_ID:N" on macOS).
    let matchingSource = sources.find(source => {
      const idMatch = source.id.match(/^screen:(\d+):/);
      return idMatch ? parseInt(idMatch[1]) === display.id : false;
    });

    // Method 2: map primary display → "Screen 1", others in appearance order.
    if (!matchingSource) {
      const orderIndex = sortedDisplayIds.indexOf(display.id);
      if (orderIndex >= 0 && orderIndex < sortedSources.length) {
        matchingSource = sortedSources[orderIndex];
        console.log(`[Screen Capture] Matched display ${display.id} to source "${matchingSource.name}" by sorted order`);
      }
    }

    // Last resort: raw index fallback.
    if (!matchingSource && i < sources.length) {
      matchingSource = sources[i];
      console.log(`[Screen Capture] Matched display ${display.id} by raw index ${i}`);
    }

    if (matchingSource) {
      const thumbnail = matchingSource.thumbnail;
      const capturedWidth = thumbnail.getSize().width;
      const capturedHeight = thumbnail.getSize().height;
      
      displayCaptures.push({
        displayId: display.id,
        dataUrl: thumbnail.toDataURL(),
        width: capturedWidth,
        height: capturedHeight,
        scaleFactor: display.scaleFactor,
        bounds: display.bounds,
      });
    } else {
      console.warn(`[Screen Capture] Could not match source for display ${display.id}`);
    }
  }

  if (displayCaptures.length === 0) {
    console.error('[Screen Capture] Could not match any capture sources to displays');
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

/**
 * Check memory usage and clear cache if needed
 * Clears capture cache when memory exceeds 150MB
 */
export function checkMemoryUsage(): void {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapUsed + memoryUsage.external;
  
  if (totalMemory > MEMORY_LIMIT_BYTES) {
    console.warn(`[Screen Capture] Memory usage (${Math.round(totalMemory / 1024 / 1024)}MB) exceeds limit (${MEMORY_LIMIT_BYTES / 1024 / 1024}MB), clearing cache`);
    invalidateCaptureCache();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('[Screen Capture] Forced garbage collection');
    }
  }
}

export function copyToClipboard(text: string): void {
  clipboard.writeText(text);
}
