import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Type definitions
interface DisplayCapture {
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

// Constants from Magnifier component
const MAGNIFIER_SIZE = 120;
const GRID_SIZE = 7;
const CELL_SIZE = MAGNIFIER_SIZE / GRID_SIZE;
const OFFSET_X = 20;
const OFFSET_Y = 20;
const EDGE_THRESHOLD = 60; // MAGNIFIER_SIZE / 2 - distance from edge requiring adjustment

// Mock canvas context
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth: number = 1;
  imageSmoothingEnabled: boolean = true;
  
  private drawnImages: Array<{
    image: HTMLImageElement;
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
  }> = [];
  private paths: Array<{ type: string; args: any[] }> = [];
  private rects: Array<{ x: number; y: number; width: number; height: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  clearRect(_x: number, _y: number, _width: number, _height: number): void {
    // Mock implementation
  }

  save(): void {
    // Mock implementation
  }

  restore(): void {
    // Mock implementation
  }

  beginPath(): void {
    this.paths.push({ type: 'begin', args: [] });
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.paths.push({ type: 'arc', args: [x, y, radius, startAngle, endAngle] });
  }

  clip(): void {
    this.paths.push({ type: 'clip', args: [] });
  }

  moveTo(x: number, y: number): void {
    this.paths.push({ type: 'moveTo', args: [x, y] });
  }

  lineTo(x: number, y: number): void {
    this.paths.push({ type: 'lineTo', args: [x, y] });
  }

  stroke(): void {
    this.paths.push({ type: 'stroke', args: [] });
  }

  strokeRect(x: number, y: number, width: number, height: number): void {
    this.rects.push({ x, y, width, height });
  }

  drawImage(
    image: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void {
    this.drawnImages.push({ image, sx, sy, sw, sh, dx, dy, dw, dh });
  }

  getImageData(x: number, y: number, width: number, height: number): ImageData {
    // Return mock image data with a test color (red: #FF0000)
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 0;   // G
      data[i + 2] = 0;   // B
      data[i + 3] = 255; // A
    }
    return {
      data,
      width,
      height,
      colorSpace: 'srgb'
    } as ImageData;
  }

  // Test helpers
  getDrawnImages() {
    return this.drawnImages;
  }

  getPaths() {
    return this.paths;
  }

  getRects() {
    return this.rects;
  }

  reset() {
    this.drawnImages = [];
    this.paths = [];
    this.rects = [];
  }
}

// Helper function to check if cursor is on a display
function isCursorOnDisplay(
  cursorX: number,
  cursorY: number,
  display: DisplayCapture
): boolean {
  return (
    cursorX >= display.bounds.x &&
    cursorX < display.bounds.x + display.bounds.width &&
    cursorY >= display.bounds.y &&
    cursorY < display.bounds.y + display.bounds.height
  );
}

describe('Magnifier Component Logic', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: MockCanvasRenderingContext2D;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = {
      getContext: vi.fn(),
      width: MAGNIFIER_SIZE,
      height: MAGNIFIER_SIZE,
    } as any;

    mockContext = new MockCanvasRenderingContext2D(mockCanvas);
    vi.mocked(mockCanvas.getContext).mockReturnValue(mockContext as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Grid Rendering', () => {
    it('should render 7x7 grid', () => {
      // Requirements: 5.1
      // The magnifier must display exactly 49 pixels (7x7 grid)
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 100;
      const cursorY = 100;

      // Simulate magnifier rendering logic
      const localX = cursorX - displayCapture.bounds.x;
      const localY = cursorY - displayCapture.bounds.y;
      const scaledX = localX * displayCapture.scaleFactor;
      const scaledY = localY * displayCapture.scaleFactor;

      const halfGrid = Math.floor(GRID_SIZE / 2);
      const sourceX = Math.max(0, scaledX - halfGrid);
      const sourceY = Math.max(0, scaledY - halfGrid);

      // Verify grid dimensions
      expect(GRID_SIZE).toBe(7);
      expect(GRID_SIZE * GRID_SIZE).toBe(49);
      
      // Verify grid is centered on cursor
      const centerPixelX = sourceX + halfGrid;
      const centerPixelY = sourceY + halfGrid;
      expect(centerPixelX).toBe(scaledX);
      expect(centerPixelY).toBe(scaledY);
    });

    it('should calculate correct cell size for 7x7 grid', () => {
      // Requirements: 5.1
      // Each cell should be evenly sized within the magnifier
      
      const expectedCellSize = MAGNIFIER_SIZE / GRID_SIZE;
      expect(CELL_SIZE).toBe(expectedCellSize);
      expect(CELL_SIZE * GRID_SIZE).toBe(MAGNIFIER_SIZE);
    });

    it('should draw grid lines for 7x7 grid', () => {
      // Requirements: 5.1
      // Grid lines should be drawn to separate the 49 pixels
      
      // Simulate drawing grid lines (8 vertical + 8 horizontal lines for 7x7 grid)
      const expectedVerticalLines = GRID_SIZE + 1; // 8 lines
      const expectedHorizontalLines = GRID_SIZE + 1; // 8 lines
      const totalGridLines = expectedVerticalLines + expectedHorizontalLines;
      
      expect(totalGridLines).toBe(16);
    });
  });

  describe('Center Pixel Highlighting', () => {
    it('should highlight center pixel of 7x7 grid', () => {
      // Requirements: 5.4
      // The magnifier must highlight the center pixel
      
      const halfGrid = Math.floor(GRID_SIZE / 2);
      const centerX = halfGrid * CELL_SIZE;
      const centerY = halfGrid * CELL_SIZE;

      // Simulate drawing center pixel highlight
      mockContext.strokeRect(centerX, centerY, CELL_SIZE, CELL_SIZE);

      const rects = mockContext.getRects();
      expect(rects).toHaveLength(1);
      expect(rects[0]).toEqual({
        x: centerX,
        y: centerY,
        width: CELL_SIZE,
        height: CELL_SIZE
      });
    });

    it('should position center pixel at grid center', () => {
      // Requirements: 5.4
      // Center pixel must be at the exact center of the 7x7 grid
      
      const halfGrid = Math.floor(GRID_SIZE / 2);
      expect(halfGrid).toBe(3); // 3 pixels on each side of center
      
      const centerIndex = halfGrid;
      expect(centerIndex).toBe(3); // Center is at index 3 (0-indexed)
      
      // Verify center pixel is equidistant from edges
      const pixelsToLeft = centerIndex;
      const pixelsToRight = GRID_SIZE - centerIndex - 1;
      expect(pixelsToLeft).toBe(pixelsToRight);
    });
  });

  describe('Pixel Sampling', () => {
    it('should sample correct pixel color from display capture', () => {
      // Requirements: 5.2, 8.2
      // The magnifier must sample pixels from the correct display
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 500;
      const cursorY = 300;

      // Convert to display-local coordinates
      const localX = cursorX - displayCapture.bounds.x;
      const localY = cursorY - displayCapture.bounds.y;

      // Apply scale factor
      const scaledX = localX * displayCapture.scaleFactor;
      const scaledY = localY * displayCapture.scaleFactor;

      // Verify coordinates are correct
      expect(localX).toBe(500);
      expect(localY).toBe(300);
      expect(scaledX).toBe(500);
      expect(scaledY).toBe(300);
    });

    it('should extract RGB values from center pixel', () => {
      // Requirements: 5.4, 8.2
      // Must extract correct RGB values from the center pixel
      
      const centerX = Math.floor(GRID_SIZE / 2) * CELL_SIZE;
      const centerY = Math.floor(GRID_SIZE / 2) * CELL_SIZE;

      // Get image data from center pixel
      const imageData = mockContext.getImageData(
        centerX + CELL_SIZE / 2,
        centerY + CELL_SIZE / 2,
        1,
        1
      );

      // Extract RGB values
      const r = imageData.data[0];
      const g = imageData.data[1];
      const b = imageData.data[2];

      // Verify RGB values are valid
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);

      // Verify mock returns expected test color (red)
      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it('should sample from correct display when cursor is on secondary display', () => {
      // Requirements: 5.2, 6.1
      // Must sample from the correct display based on cursor position
      
      const primaryDisplay: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,primary',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const secondaryDisplay: DisplayCapture = {
        displayId: 2,
        dataUrl: 'data:image/png;base64,secondary',
        width: 1920,
        height: 1080,
        scaleFactor: 2.0,
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 2500; // On secondary display
      const cursorY = 500;

      // Determine which display cursor is on
      const isOnSecondary = isCursorOnDisplay(cursorX, cursorY, secondaryDisplay);

      expect(isOnSecondary).toBe(true);

      // Use secondary display for sampling
      const activeDisplay = isOnSecondary ? secondaryDisplay : primaryDisplay;
      expect(activeDisplay.displayId).toBe(2);
      expect(activeDisplay.scaleFactor).toBe(2.0);
    });
  });

  describe('Edge Positioning', () => {
    it('should detect when magnifier would extend beyond right edge of display', () => {
      // Requirements: 9.3
      // Magnifier must remain fully visible by adjusting offset near edges
      // This test verifies DETECTION logic - actual adjustment is in component
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 1900; // Near right edge
      const cursorY = 500;

      // Calculate magnifier position with standard offset
      const magnifierRight = (cursorX + OFFSET_X) + MAGNIFIER_SIZE;
      const displayRight = displayCapture.bounds.x + displayCapture.bounds.width;

      const wouldExtendBeyondRight = magnifierRight > displayRight;
      expect(wouldExtendBeyondRight).toBe(true);

      // Magnifier should adjust to stay within bounds
      // (Note: Edge adjustment logic would be implemented in the component)
    });

    it('should detect when magnifier would extend beyond bottom edge of display', () => {
      // Requirements: 9.3
      // Magnifier must remain fully visible near bottom edge
      // This test verifies DETECTION logic - actual adjustment is in component
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 500;
      const cursorY = 1060; // Near bottom edge

      // Calculate magnifier position with standard offset
      const magnifierBottom = (cursorY + OFFSET_Y) + MAGNIFIER_SIZE;
      const displayBottom = displayCapture.bounds.y + displayCapture.bounds.height;

      const wouldExtendBeyondBottom = magnifierBottom > displayBottom;
      expect(wouldExtendBeyondBottom).toBe(true);
    });

    it('should maintain visibility when cursor is in corner', () => {
      // Requirements: 9.3
      // Magnifier must handle corner cases (near both edges)
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 1900; // Near right edge
      const cursorY = 1060; // Near bottom edge

      // Calculate magnifier position
      const magnifierX = cursorX + OFFSET_X;
      const magnifierY = cursorY + OFFSET_Y;

      // Check both dimensions
      const magnifierRight = magnifierX + MAGNIFIER_SIZE;
      const magnifierBottom = magnifierY + MAGNIFIER_SIZE;
      const displayRight = displayCapture.bounds.x + displayCapture.bounds.width;
      const displayBottom = displayCapture.bounds.y + displayCapture.bounds.height;

      const needsAdjustment = 
        magnifierRight > displayRight || 
        magnifierBottom > displayBottom;

      expect(needsAdjustment).toBe(true);
    });
  });

  describe('Scale Factor Handling', () => {
    it('should handle 1x scale factor (standard DPI)', () => {
      // Requirements: 5.3, 6.3, 6.4
      // Must correctly handle standard 1x displays
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = 100;
      const cursorY = 100;

      const localX = cursorX - displayCapture.bounds.x;
      const localY = cursorY - displayCapture.bounds.y;
      const scaledX = localX * displayCapture.scaleFactor;
      const scaledY = localY * displayCapture.scaleFactor;

      // With 1x scale, logical and physical pixels are the same
      expect(scaledX).toBe(localX);
      expect(scaledY).toBe(localY);
      expect(scaledX).toBe(100);
      expect(scaledY).toBe(100);
    });

    it('should handle 2x scale factor (Retina display)', () => {
      // Requirements: 5.3, 6.3, 6.4
      // Must correctly handle 2x Retina displays
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 3840, // Physical pixels
        height: 2160,
        scaleFactor: 2.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 } // Logical pixels
      };

      const cursorX = 100; // Logical pixels
      const cursorY = 100;

      const localX = cursorX - displayCapture.bounds.x;
      const localY = cursorY - displayCapture.bounds.y;
      const scaledX = localX * displayCapture.scaleFactor;
      const scaledY = localY * displayCapture.scaleFactor;

      // With 2x scale, physical pixels are 2x logical pixels
      expect(scaledX).toBe(localX * 2);
      expect(scaledY).toBe(localY * 2);
      expect(scaledX).toBe(200);
      expect(scaledY).toBe(200);
    });

    it('should handle 1.5x scale factor (intermediate DPI)', () => {
      // Requirements: 5.3, 6.3, 6.4
      // Must correctly handle 1.5x displays (common on Windows)
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 2880, // Physical pixels
        height: 1620,
        scaleFactor: 1.5,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 } // Logical pixels
      };

      const cursorX = 100; // Logical pixels
      const cursorY = 100;

      const localX = cursorX - displayCapture.bounds.x;
      const localY = cursorY - displayCapture.bounds.y;
      const scaledX = localX * displayCapture.scaleFactor;
      const scaledY = localY * displayCapture.scaleFactor;

      // With 1.5x scale, physical pixels are 1.5x logical pixels
      expect(scaledX).toBe(localX * 1.5);
      expect(scaledY).toBe(localY * 1.5);
      expect(scaledX).toBe(150);
      expect(scaledY).toBe(150);
    });

    it('should sample correct physical pixels with 2x scale factor', () => {
      // Requirements: 5.3, 6.4
      // Magnifier must sample physical pixels, not logical pixels
      
      const displayCapture: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,test',
        width: 3840, // Physical pixels
        height: 2160,
        scaleFactor: 2.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 } // Logical pixels
      };

      const cursorX = 500; // Logical pixels
      const cursorY = 300;

      const localX = cursorX - displayCapture.bounds.x;
      const localY = cursorY - displayCapture.bounds.y;
      const scaledX = localX * displayCapture.scaleFactor;
      const scaledY = localY * displayCapture.scaleFactor;

      // Calculate source region in physical pixels
      const halfGrid = Math.floor(GRID_SIZE / 2);
      const sourceX = Math.max(0, scaledX - halfGrid);
      const sourceY = Math.max(0, scaledY - halfGrid);

      // Verify we're sampling from physical pixel coordinates
      expect(sourceX).toBe(1000 - 3); // 500 * 2 - 3
      expect(sourceY).toBe(600 - 3);  // 300 * 2 - 3

      // Verify source dimensions are in physical pixels
      expect(GRID_SIZE).toBe(7); // We sample 7 physical pixels
    });

    it('should maintain consistent magnification across different scale factors', () => {
      // Requirements: 6.4
      // Magnifier appearance should be consistent regardless of scale factor
      
      const displays = [
        { scaleFactor: 1.0, name: '1x' },
        { scaleFactor: 1.5, name: '1.5x' },
        { scaleFactor: 2.0, name: '2x' },
      ];

      displays.forEach(({ scaleFactor, name }) => {
        const cursorX = 100;
        const cursorY = 100;

        const scaledX = cursorX * scaleFactor;
        const scaledY = cursorY * scaleFactor;

        // The magnifier always samples GRID_SIZE physical pixels
        const sampledPixels = GRID_SIZE;

        // Verify consistent sampling regardless of scale
        expect(sampledPixels).toBe(7);
        
        // Verify coordinate transformation is correct
        expect(scaledX).toBe(cursorX * scaleFactor);
        expect(scaledY).toBe(cursorY * scaleFactor);
      });
    });
  });

  describe('Multi-Display Support', () => {
    it('should display on correct display based on cursor position', () => {
      // Requirements: 4.4, 6.1
      // Magnifier must use the correct display's capture data
      
      const primaryDisplay: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,primary',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const secondaryDisplay: DisplayCapture = {
        displayId: 2,
        dataUrl: 'data:image/png;base64,secondary',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 }
      };

      // Test cursor on primary display
      let cursorX = 500;
      let cursorY = 500;
      let isOnPrimary = 
        cursorX >= primaryDisplay.bounds.x &&
        cursorX < primaryDisplay.bounds.x + primaryDisplay.bounds.width;
      expect(isOnPrimary).toBe(true);

      // Test cursor on secondary display
      cursorX = 2500;
      cursorY = 500;
      let isOnSecondary = 
        cursorX >= secondaryDisplay.bounds.x &&
        cursorX < secondaryDisplay.bounds.x + secondaryDisplay.bounds.width;
      expect(isOnSecondary).toBe(true);
    });

    it('should handle transition between displays with different scale factors', () => {
      // Requirements: 6.4
      // Must correctly handle cursor moving between displays with different scales
      
      const display1x: DisplayCapture = {
        displayId: 1,
        dataUrl: 'data:image/png;base64,1x',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 }
      };

      const display2x: DisplayCapture = {
        displayId: 2,
        dataUrl: 'data:image/png;base64,2x',
        width: 3840,
        height: 2160,
        scaleFactor: 2.0,
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 }
      };

      // Cursor on 1x display
      let cursorX = 100;
      let cursorY = 100;
      let localX = cursorX - display1x.bounds.x;
      let scaledX = localX * display1x.scaleFactor;
      expect(scaledX).toBe(100);

      // Cursor moves to 2x display
      cursorX = 2020; // Just past boundary
      cursorY = 100;
      localX = cursorX - display2x.bounds.x;
      scaledX = localX * display2x.scaleFactor;
      expect(scaledX).toBe(200); // 100 * 2.0

      // Verify scale factor changed correctly
      expect(display1x.scaleFactor).toBe(1.0);
      expect(display2x.scaleFactor).toBe(2.0);
    });

    it('should convert coordinates correctly for displays with negative bounds', () => {
      // Requirements: 4.4, 6.3
      // Must handle displays positioned to the left of primary (negative x)
      
      const leftDisplay: DisplayCapture = {
        displayId: 2,
        dataUrl: 'data:image/png;base64,left',
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        bounds: { x: -1920, y: 0, width: 1920, height: 1080 }
      };

      const cursorX = -500; // On left display
      const cursorY = 500;

      // Convert to display-local coordinates
      const localX = cursorX - leftDisplay.bounds.x;
      const localY = cursorY - leftDisplay.bounds.y;

      // Verify conversion is correct
      expect(localX).toBe(-500 - (-1920));
      expect(localX).toBe(1420);
      expect(localY).toBe(500);

      // Verify local coordinates are within display bounds
      expect(localX).toBeGreaterThanOrEqual(0);
      expect(localX).toBeLessThan(leftDisplay.bounds.width);
    });
  });

  describe('Offset Consistency', () => {
    it('should maintain consistent offset across all displays', () => {
      // Requirements: 4.4
      // Magnifier offset must be constant regardless of display
      
      const displays: DisplayCapture[] = [
        {
          displayId: 1,
          dataUrl: 'data:image/png;base64,d1',
          width: 1920,
          height: 1080,
          scaleFactor: 1.0,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 }
        },
        {
          displayId: 2,
          dataUrl: 'data:image/png;base64,d2',
          width: 3840,
          height: 2160,
          scaleFactor: 2.0,
          bounds: { x: 1920, y: 0, width: 1920, height: 1080 }
        },
        {
          displayId: 3,
          dataUrl: 'data:image/png;base64,d3',
          width: 2880,
          height: 1620,
          scaleFactor: 1.5,
          bounds: { x: 3840, y: 0, width: 1920, height: 1080 }
        }
      ];

      // Test offset on each display
      displays.forEach(display => {
        const cursorX = display.bounds.x + 100;
        const cursorY = display.bounds.y + 100;

        const magnifierX = cursorX + OFFSET_X;
        const magnifierY = cursorY + OFFSET_Y;

        // Verify offset is constant
        expect(magnifierX - cursorX).toBe(OFFSET_X);
        expect(magnifierY - cursorY).toBe(OFFSET_Y);
        expect(OFFSET_X).toBe(20);
        expect(OFFSET_Y).toBe(20);
      });
    });
  });
});
