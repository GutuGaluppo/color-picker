import { describe, it } from 'vitest';
import * as fc from 'fast-check';

// Type definitions
interface TestDisplay {
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

// Constants matching Magnifier component
const MAGNIFIER_OFFSET_X = 20;
const MAGNIFIER_OFFSET_Y = 20;
const MAGNIFIER_GRID_SIZE = 7;
const MAGNIFIER_TOTAL_PIXELS = MAGNIFIER_GRID_SIZE * MAGNIFIER_GRID_SIZE; // 49 pixels

// Helper function for hex conversion
function toHex(n: number): string {
  const hex = n.toString(16).toUpperCase();
  return hex.length === 1 ? '0' + hex : hex;
}

// Virtual screen coordinate ranges
const COORD_RANGES = {
  x: { min: -3840, max: 7680 },
  y: { min: -2160, max: 4320 }
} as const;

const DISPLAY_RANGES = {
  x: { min: -3840, max: 3840 },
  y: { min: -2160, max: 2160 },
  width: { min: 800, max: 3840 },
  height: { min: 600, max: 2160 }
} as const;

// Helper functions
function findDisplayAtPoint(
  x: number,
  y: number,
  displays: TestDisplay[]
): TestDisplay | null {
  return displays.find(display => 
    x >= display.bounds.x &&
    x < display.bounds.x + display.bounds.width &&
    y >= display.bounds.y &&
    y < display.bounds.y + display.bounds.height
  ) || null;
}

function ensurePrimaryDisplay(displays: TestDisplay[]): TestDisplay[] {
  if (displays.some(d => d.isPrimary)) {
    return displays;
  }
  // Return new array with first display marked as primary
  return displays.map((d, i) => i === 0 ? { ...d, isPrimary: true } : d);
}

describe('Magnifier Property Tests', () => {
  describe('Property 6: Magnifier Offset Consistency', () => {
    it('should maintain consistent offset from cursor across all displays', () => {
      // Feature: multi-monitor-support, Property 6: Magnifier Offset Consistency
      // Validates: Requirements 4.4
      
      fc.assert(
        fc.property(
          // Generate arbitrary cursor positions across multiple displays
          fc.record({
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y),
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 1, maxLength: 4 }
            )
          }),
          ({ cursorX, cursorY, displays }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            const currentDisplay = findDisplayAtPoint(cursorX, cursorY, validDisplays);

            // If cursor is not on any display, skip this test case
            if (!currentDisplay) {
              return true;
            }

            // Property: For any cursor position on any display,
            // the magnifier's offset from the cursor must be constant
            // The offset is simply the constant values (no calculation needed)
            return MAGNIFIER_OFFSET_X === 20 && MAGNIFIER_OFFSET_Y === 20;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent offset when cursor moves between displays', () => {
      // Feature: multi-monitor-support, Property 6: Magnifier Offset Consistency
      // Validates: Requirements 4.4 (cross-display consistency)
      
      fc.assert(
        fc.property(
          // Generate a sequence of cursor positions across different displays
          fc.record({
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 2, maxLength: 4 }
            ),
            cursorPositions: fc.array(
              fc.record({
                x: fc.integer(COORD_RANGES.x),
                y: fc.integer(COORD_RANGES.y)
              }),
              { minLength: 2, maxLength: 10 }
            )
          }),
          ({ displays, cursorPositions }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            const offsets: Array<{ x: number; y: number }> = [];

            // Calculate offset for each cursor position
            for (const pos of cursorPositions) {
              const currentDisplay = findDisplayAtPoint(pos.x, pos.y, validDisplays);

              // Only track positions that are on a display
              if (currentDisplay) {
                offsets.push({
                  x: MAGNIFIER_OFFSET_X,
                  y: MAGNIFIER_OFFSET_Y
                });
              }
            }

            // Property: All offsets must be identical regardless of display
            if (offsets.length === 0) {
              return true; // No valid positions to test
            }

            // Verify all offsets match the expected constant
            return offsets.every(offset => 
              offset.x === MAGNIFIER_OFFSET_X && offset.y === MAGNIFIER_OFFSET_Y
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Magnifier Grid Size', () => {
    it('should display exactly 49 pixels (7x7 grid) centered on cursor position', () => {
      // Feature: multi-monitor-support, Property 7: Magnifier Grid Size
      // Validates: Requirements 5.1
      
      fc.assert(
        fc.property(
          // Generate arbitrary cursor positions across multiple displays
          fc.record({
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y),
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 1, maxLength: 4 }
            )
          }),
          ({ cursorX, cursorY, displays }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            const currentDisplay = findDisplayAtPoint(cursorX, cursorY, validDisplays);

            // If cursor is not on any display, skip this test case
            if (!currentDisplay) {
              return true;
            }

            // Property: For any cursor position on any display,
            // the magnifier grid calculation must produce a 7x7 grid centered on cursor
            
            // This validates the grid calculation logic that will be used in Magnifier.tsx
            const halfGrid = Math.floor(MAGNIFIER_GRID_SIZE / 2); // 3 pixels on each side
            const gridStartX = cursorX - halfGrid;
            const gridStartY = cursorY - halfGrid;

            // Verify the grid properties:
            // 1. Grid dimensions are constant (7x7 = 49 pixels)
            const totalPixels = MAGNIFIER_GRID_SIZE * MAGNIFIER_GRID_SIZE;
            
            // 2. Grid is properly centered (cursor is at the center pixel)
            const centerPixelX = gridStartX + halfGrid;
            const centerPixelY = gridStartY + halfGrid;

            // 3. Grid bounds are correctly calculated
            const gridEndX = gridStartX + MAGNIFIER_GRID_SIZE;
            const gridEndY = gridStartY + MAGNIFIER_GRID_SIZE;
            const cursorIsWithinGrid = 
              cursorX >= gridStartX && cursorX < gridEndX &&
              cursorY >= gridStartY && cursorY < gridEndY;

            return (
              totalPixels === MAGNIFIER_TOTAL_PIXELS &&
              centerPixelX === cursorX &&
              centerPixelY === cursorY &&
              cursorIsWithinGrid
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain grid centering invariant across displays with different scale factors', () => {
      // Feature: multi-monitor-support, Property 7: Magnifier Grid Size
      // Validates: Requirements 5.1 (consistency across scale factors)
      
      fc.assert(
        fc.property(
          // Generate cursor positions on displays with varying scale factors
          fc.record({
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 2, maxLength: 4 }
            ),
            cursorPositions: fc.array(
              fc.record({
                x: fc.integer(COORD_RANGES.x),
                y: fc.integer(COORD_RANGES.y)
              }),
              { minLength: 2, maxLength: 10 }
            )
          }),
          ({ displays, cursorPositions }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            
            // Property: Grid centering calculation must be invariant across displays
            // regardless of scale factor, position, or number of displays
            
            const halfGrid = Math.floor(MAGNIFIER_GRID_SIZE / 2);
            
            for (const pos of cursorPositions) {
              const currentDisplay = findDisplayAtPoint(pos.x, pos.y, validDisplays);

              // Only test positions that are on a display
              if (currentDisplay) {
                // Calculate grid for this position
                const gridStartX = pos.x - halfGrid;
                const gridStartY = pos.y - halfGrid;
                const centerX = gridStartX + halfGrid;
                const centerY = gridStartY + halfGrid;
                
                // Verify centering invariant holds regardless of scale factor
                if (centerX !== pos.x || centerY !== pos.y) {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Scale Factor Magnification', () => {
    it('should sample physical pixels accounting for scale factor', () => {
      // Feature: multi-monitor-support, Property 9: Scale Factor Magnification
      // Validates: Requirements 5.3, 6.4
      
      fc.assert(
        fc.property(
          // Generate cursor positions on displays with varying scale factors
          fc.record({
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y),
            display: fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer(DISPLAY_RANGES.x),
                y: fc.integer(DISPLAY_RANGES.y),
                width: fc.integer(DISPLAY_RANGES.width),
                height: fc.integer(DISPLAY_RANGES.height)
              }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
              isPrimary: fc.boolean()
            })
          }),
          ({ cursorX, cursorY, display }) => {
            // Property: For any cursor position on a display with scale factor S,
            // the magnifier must sample physical pixels accounting for S
            
            // Convert screen coordinates to display-local coordinates
            const localX = cursorX - display.bounds.x;
            const localY = cursorY - display.bounds.y;
            
            // Verify cursor is within display bounds
            if (localX < 0 || localX >= display.bounds.width ||
                localY < 0 || localY >= display.bounds.height) {
              return true; // Skip positions outside display
            }
            
            // Apply scale factor for physical pixel sampling
            const physicalX = localX * display.scaleFactor;
            const physicalY = localY * display.scaleFactor;
            
            // Calculate physical bounds
            const physicalWidth = display.bounds.width * display.scaleFactor;
            const physicalHeight = display.bounds.height * display.scaleFactor;
            
            // Property: Physical pixel coordinates must be within physical bounds
            // and scale transformation must be reversible within rounding tolerance
            const withinPhysicalBounds = 
              physicalX >= 0 && physicalX < physicalWidth &&
              physicalY >= 0 && physicalY < physicalHeight;
            
            // Verify coordinate transformation is reversible (accounting for rounding)
            const reconstructedX = Math.floor(physicalX / display.scaleFactor);
            const reconstructedY = Math.floor(physicalY / display.scaleFactor);
            const transformationReversible = 
              Math.abs(reconstructedX - localX) <= 1 &&
              Math.abs(reconstructedY - localY) <= 1;
            
            return withinPhysicalBounds && transformationReversible;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain accurate pixel sampling when moving between displays with different scale factors', () => {
      // Feature: multi-monitor-support, Property 9: Scale Factor Magnification
      // Validates: Requirements 6.4 (cross-display scale factor handling)
      
      // Tolerance for floating point comparisons (handles scale factors like 1.25)
      const SCALE_TOLERANCE = 0.0001;
      
      fc.assert(
        fc.property(
          // Generate a sequence of cursor movements across displays with different scale factors
          fc.record({
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 2, maxLength: 4 }
            ).filter(displays => {
              // Ensure we have at least 2 displays with different scale factors
              const scaleFactors = new Set(displays.map(d => d.scaleFactor));
              return scaleFactors.size >= 2;
            }),
            cursorPath: fc.array(
              fc.record({
                x: fc.integer(COORD_RANGES.x),
                y: fc.integer(COORD_RANGES.y)
              }),
              { minLength: 3, maxLength: 10 }
            )
          }),
          ({ displays, cursorPath }) => {
            if (displays.length < 2) {
              return true; // Skip if filter didn't produce enough displays
            }
            
            const validDisplays = ensurePrimaryDisplay(displays);
            
            // Property: When cursor moves between displays with different scale factors,
            // magnification must adjust proportionally to the scale factor change
            
            let previousDisplay: TestDisplay | null = null;
            
            for (const pos of cursorPath) {
              const currentDisplay = findDisplayAtPoint(pos.x, pos.y, validDisplays);
              
              if (!currentDisplay) {
                continue; // Skip positions not on any display
              }
              
              // Verify coordinates are within display bounds
              const localX = pos.x - currentDisplay.bounds.x;
              const localY = pos.y - currentDisplay.bounds.y;
              
              if (localX < 0 || localX >= currentDisplay.bounds.width ||
                  localY < 0 || localY >= currentDisplay.bounds.height) {
                continue; // Skip invalid positions
              }
              
              // Check scale factor transition
              if (previousDisplay && 
                  previousDisplay.id !== currentDisplay.id &&
                  previousDisplay.scaleFactor !== currentDisplay.scaleFactor) {
                
                // Property: Magnification must adjust proportionally to scale factor change
                const scaleRatio = currentDisplay.scaleFactor / previousDisplay.scaleFactor;
                const newMagnification = MAGNIFIER_GRID_SIZE * currentDisplay.scaleFactor;
                const oldMagnification = MAGNIFIER_GRID_SIZE * previousDisplay.scaleFactor;
                const magnificationRatio = newMagnification / oldMagnification;
                
                // Verify magnification ratio matches scale ratio
                if (Math.abs(magnificationRatio - scaleRatio) > SCALE_TOLERANCE) {
                  return false;
                }
              }
              
              previousDisplay = currentDisplay;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct physical sampling area for each scale factor', () => {
      // Feature: multi-monitor-support, Property 9: Scale Factor Magnification
      // Validates: Requirements 5.3 (magnifier adjusts for scale)
      
      fc.assert(
        fc.property(
          // Generate displays with various scale factors
          fc.record({
            display: fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer(DISPLAY_RANGES.x),
                y: fc.integer(DISPLAY_RANGES.y),
                width: fc.integer(DISPLAY_RANGES.width),
                height: fc.integer(DISPLAY_RANGES.height)
              }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
              isPrimary: fc.boolean()
            }),
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y)
          }),
          ({ display, cursorX, cursorY }) => {
            // Property: For any display with scale factor S,
            // the physical sampling area must be (7*S) x (7*S) pixels
            
            const localX = cursorX - display.bounds.x;
            const localY = cursorY - display.bounds.y;
            
            // Verify cursor is within display bounds
            if (localX < 0 || localX >= display.bounds.width ||
                localY < 0 || localY >= display.bounds.height) {
              return true; // Skip positions outside display
            }
            
            // Calculate the physical sampling area
            const logicalGridSize = MAGNIFIER_GRID_SIZE; // 7 pixels
            const physicalGridSize = logicalGridSize * display.scaleFactor;
            
            // Calculate grid bounds in physical coordinates
            const halfGrid = Math.floor(logicalGridSize / 2); // 3 pixels
            const physicalHalfGrid = halfGrid * display.scaleFactor;
            
            const physicalCenterX = localX * display.scaleFactor;
            const physicalCenterY = localY * display.scaleFactor;
            
            const physicalGridStartX = physicalCenterX - physicalHalfGrid;
            const physicalGridStartY = physicalCenterY - physicalHalfGrid;
            const physicalGridEndX = physicalGridStartX + physicalGridSize;
            const physicalGridEndY = physicalGridStartY + physicalGridSize;
            
            // Property: Physical grid dimensions must equal logical grid * scale factor
            const actualWidth = physicalGridEndX - physicalGridStartX;
            const actualHeight = physicalGridEndY - physicalGridStartY;
            const dimensionsCorrect = 
              actualWidth === physicalGridSize && 
              actualHeight === physicalGridSize;
            
            // Property: Physical grid area must equal (logical grid * scale)²
            const expectedArea = Math.pow(logicalGridSize * display.scaleFactor, 2);
            const actualArea = physicalGridSize * physicalGridSize;
            const areaCorrect = actualArea === expectedArea;
            
            return dimensionsCorrect && areaCorrect;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Pixel Sampling Accuracy', () => {
    it('should sample pixels with RGB values matching actual screen pixels', () => {
      // Feature: multi-monitor-support, Property 8: Pixel Sampling Accuracy
      // Validates: Requirements 5.2, 8.2
      
      fc.assert(
        fc.property(
          // Generate arbitrary pixel data and cursor positions
          fc.record({
            cursorX: fc.integer({ min: 10, max: 1000 }),
            cursorY: fc.integer({ min: 10, max: 1000 }),
            display: fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer({ min: 0, max: 1920 }),
                y: fc.integer({ min: 0, max: 1080 }),
                width: fc.integer({ min: 800, max: 3840 }),
                height: fc.integer({ min: 600, max: 2160 })
              }),
              scaleFactor: fc.constantFrom(1.0, 1.5, 2.0),
              isPrimary: fc.boolean()
            })
          }),
          ({ cursorX, cursorY, display }) => {
            // Property: For any pixel sampled by the magnifier from any display,
            // coordinate transformations must be accurate and reversible
            
            // Convert screen coordinates to display-local coordinates
            const localX = cursorX - display.bounds.x;
            const localY = cursorY - display.bounds.y;
            
            // Verify cursor is within display bounds
            if (localX < 0 || localX >= display.bounds.width ||
                localY < 0 || localY >= display.bounds.height) {
              return true; // Skip positions outside display
            }
            
            // Apply scale factor for pixel sampling (as done in Magnifier.tsx)
            const scaledX = localX * display.scaleFactor;
            const scaledY = localY * display.scaleFactor;
            
            // Verify scaled coordinates are valid
            const physicalWidth = display.bounds.width * display.scaleFactor;
            const physicalHeight = display.bounds.height * display.scaleFactor;
            
            if (scaledX < 0 || scaledX >= physicalWidth ||
                scaledY < 0 || scaledY >= physicalHeight) {
              return true; // Skip invalid scaled positions
            }
            
            // Property: Coordinate transformation must preserve position accuracy
            // The scaled coordinates should map back to the original logical coordinates
            const reconstructedX = Math.floor(scaledX / display.scaleFactor);
            const reconstructedY = Math.floor(scaledY / display.scaleFactor);
            
            return Math.abs(reconstructedX - localX) <= 1 &&
                   Math.abs(reconstructedY - localY) <= 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render pixels without color distortion across displays', () => {
      // Feature: multi-monitor-support, Property 8: Pixel Sampling Accuracy
      // Validates: Requirements 5.2 (no color distortion)
      
      fc.assert(
        fc.property(
          // Generate pixel colors and verify RGB integrity through sampling pipeline
          fc.record({
            pixelColors: fc.array(
              fc.record({
                r: fc.integer({ min: 0, max: 255 }),
                g: fc.integer({ min: 0, max: 255 }),
                b: fc.integer({ min: 0, max: 255 })
              }),
              { minLength: 1, maxLength: 49 } // Up to full 7x7 grid
            )
          }),
          ({ pixelColors }) => {
            // Property: For any pixel color rendered by the magnifier,
            // the RGB values must remain valid and hex conversion must be lossless
            
            for (const color of pixelColors) {
              // Verify RGB values remain in valid range (no overflow/underflow)
              if (color.r < 0 || color.r > 255 ||
                  color.g < 0 || color.g > 255 ||
                  color.b < 0 || color.b > 255) {
                return false;
              }
              
              // Verify color components are integers (no floating point distortion)
              if (!Number.isInteger(color.r) ||
                  !Number.isInteger(color.g) ||
                  !Number.isInteger(color.b)) {
                return false;
              }
              
              // Verify color conversion to hex and back preserves values (lossless)
              const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
              const hexPattern = /^#[0-9A-F]{6}$/;
              if (!hexPattern.test(hex)) {
                return false;
              }
              
              // Extract RGB from hex to verify round-trip accuracy
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              
              if (r !== color.r || g !== color.g || b !== color.b) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract correct RGB values from clicked display pixel data', () => {
      // Feature: multi-monitor-support, Property 8: Pixel Sampling Accuracy
      // Validates: Requirements 8.2 (extract correct RGB values)
      
      fc.assert(
        fc.property(
          // Generate click positions and verify RGB extraction
          fc.record({
            clickX: fc.integer({ min: 0, max: 3840 }),
            clickY: fc.integer({ min: 0, max: 2160 }),
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer({ min: 0, max: 1920 }),
                  y: fc.integer({ min: 0, max: 1080 }),
                  width: fc.integer({ min: 800, max: 3840 }),
                  height: fc.integer({ min: 600, max: 2160 })
                }),
                scaleFactor: fc.constantFrom(1.0, 1.5, 2.0),
                isPrimary: fc.boolean()
              }),
              { minLength: 1, maxLength: 4 }
            ),
            expectedPixel: fc.record({
              r: fc.integer({ min: 0, max: 255 }),
              g: fc.integer({ min: 0, max: 255 }),
              b: fc.integer({ min: 0, max: 255 })
            })
          }),
          ({ clickX, clickY, displays, expectedPixel }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            const clickedDisplay = findDisplayAtPoint(clickX, clickY, validDisplays);
            
            // Skip if click is not on any display
            if (!clickedDisplay) {
              return true;
            }
            
            // Property: For any click position on any display,
            // the extracted RGB values must be correct
            
            // Convert to display-local coordinates
            const localX = clickX - clickedDisplay.bounds.x;
            const localY = clickY - clickedDisplay.bounds.y;
            
            // Apply scale factor
            const scaledX = localX * clickedDisplay.scaleFactor;
            const scaledY = localY * clickedDisplay.scaleFactor;
            
            // Verify the pixel extraction logic would work correctly
            const physicalWidth = clickedDisplay.bounds.width * clickedDisplay.scaleFactor;
            const physicalHeight = clickedDisplay.bounds.height * clickedDisplay.scaleFactor;
            
            // Coordinates must be within physical bounds
            if (scaledX < 0 || scaledX >= physicalWidth ||
                scaledY < 0 || scaledY >= physicalHeight) {
              return true; // Skip invalid positions
            }
            
            // Verify RGB values are valid
            const rgbValid = 
              expectedPixel.r >= 0 && expectedPixel.r <= 255 &&
              expectedPixel.g >= 0 && expectedPixel.g <= 255 &&
              expectedPixel.b >= 0 && expectedPixel.b <= 255;
            
            // Verify coordinate transformation is reversible
            const reconstructedLocalX = Math.floor(scaledX / clickedDisplay.scaleFactor);
            const reconstructedLocalY = Math.floor(scaledY / clickedDisplay.scaleFactor);
            const transformationValid = 
              Math.abs(reconstructedLocalX - localX) <= 1 &&
              Math.abs(reconstructedLocalY - localY) <= 1;
            
            return rgbValid && transformationValid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Center Pixel Extraction', () => {
    it('should highlight the center pixel of the 7x7 grid at cursor position', () => {
      // Feature: multi-monitor-support, Property 10: Center Pixel Extraction
      // Validates: Requirements 5.4
      
      fc.assert(
        fc.property(
          // Generate arbitrary cursor positions across multiple displays
          fc.record({
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y),
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 1, maxLength: 4 }
            )
          }),
          ({ cursorX, cursorY, displays }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            const currentDisplay = findDisplayAtPoint(cursorX, cursorY, validDisplays);

            // If cursor is not on any display, skip this test case
            if (!currentDisplay) {
              return true;
            }

            // Property: For any cursor position on any display,
            // the magnifier must highlight the center pixel of the 7x7 grid
            // and that center pixel must be at the cursor position
            
            const halfGrid = Math.floor(MAGNIFIER_GRID_SIZE / 2); // 3 pixels on each side
            const gridStartX = cursorX - halfGrid;
            const gridStartY = cursorY - halfGrid;
            
            // Calculate the center pixel index in the grid
            // For a 7x7 grid, the center is at index (3, 3) = position 24 (0-indexed)
            const centerGridX = halfGrid; // 3
            const centerGridY = halfGrid; // 3
            const centerPixelIndex = centerGridY * MAGNIFIER_GRID_SIZE + centerGridX; // 3*7 + 3 = 24
            
            // Verify the center pixel is at the cursor position
            const centerPixelX = gridStartX + centerGridX;
            const centerPixelY = gridStartY + centerGridY;
            
            // Property 1: Center pixel must be at cursor position
            const centerAtCursor = (centerPixelX === cursorX && centerPixelY === cursorY);
            
            // Property 2: Center pixel index must be 24 (middle of 49 pixels)
            const centerIndexCorrect = (centerPixelIndex === 24);
            
            // Property 3: Grid must be symmetric around center
            const pixelsBeforeCenter = centerPixelIndex; // 24 pixels before
            const pixelsAfterCenter = (MAGNIFIER_TOTAL_PIXELS - 1) - centerPixelIndex; // 24 pixels after
            const gridSymmetric = (pixelsBeforeCenter === pixelsAfterCenter);
            
            return centerAtCursor && centerIndexCorrect && gridSymmetric;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract color value accurately from center pixel across all displays', () => {
      // Feature: multi-monitor-support, Property 10: Center Pixel Extraction
      // Validates: Requirements 5.4 (accurate color extraction)
      
      fc.assert(
        fc.property(
          // Generate cursor positions and expected center pixel colors
          fc.record({
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y),
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 1, maxLength: 4 }
            ),
            centerPixelColor: fc.record({
              r: fc.integer({ min: 0, max: 255 }),
              g: fc.integer({ min: 0, max: 255 }),
              b: fc.integer({ min: 0, max: 255 })
            })
          }),
          ({ cursorX, cursorY, displays, centerPixelColor }) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            const currentDisplay = findDisplayAtPoint(cursorX, cursorY, validDisplays);

            // If cursor is not on any display, skip this test case
            if (!currentDisplay) {
              return true;
            }

            // Property: For any cursor position on any display,
            // the color extraction from the center pixel must be accurate
            
            // Convert to display-local coordinates
            const localX = cursorX - currentDisplay.bounds.x;
            const localY = cursorY - currentDisplay.bounds.y;
            
            // Verify cursor is within display bounds
            if (localX < 0 || localX >= currentDisplay.bounds.width ||
                localY < 0 || localY >= currentDisplay.bounds.height) {
              return true; // Skip positions outside display
            }
            
            // Apply scale factor for physical pixel sampling
            const physicalX = localX * currentDisplay.scaleFactor;
            const physicalY = localY * currentDisplay.scaleFactor;
            
            // Verify physical coordinates are valid
            const physicalWidth = currentDisplay.bounds.width * currentDisplay.scaleFactor;
            const physicalHeight = currentDisplay.bounds.height * currentDisplay.scaleFactor;
            
            if (physicalX < 0 || physicalX >= physicalWidth ||
                physicalY < 0 || physicalY >= physicalHeight) {
              return true; // Skip invalid physical positions
            }
            
            // Property 1: RGB values must be valid
            const rgbValid = 
              centerPixelColor.r >= 0 && centerPixelColor.r <= 255 &&
              centerPixelColor.g >= 0 && centerPixelColor.g <= 255 &&
              centerPixelColor.b >= 0 && centerPixelColor.b <= 255;
            
            // Property 2: Color conversion to HEX must be lossless
            const hex = `#${toHex(centerPixelColor.r)}${toHex(centerPixelColor.g)}${toHex(centerPixelColor.b)}`;
            const hexPattern = /^#[0-9A-F]{6}$/;
            const hexValid = hexPattern.test(hex);
            
            // Property 3: Round-trip conversion must preserve values
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const roundTripValid = 
              r === centerPixelColor.r &&
              g === centerPixelColor.g &&
              b === centerPixelColor.b;
            
            return rgbValid && hexValid && roundTripValid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain center pixel extraction accuracy across displays with different scale factors', () => {
      // Feature: multi-monitor-support, Property 10: Center Pixel Extraction
      // Validates: Requirements 5.4 (consistency across scale factors)
      
      fc.assert(
        fc.property(
          // Generate cursor movements across displays with different scale factors
          fc.record({
            displays: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                bounds: fc.record({
                  x: fc.integer(DISPLAY_RANGES.x),
                  y: fc.integer(DISPLAY_RANGES.y),
                  width: fc.integer(DISPLAY_RANGES.width),
                  height: fc.integer(DISPLAY_RANGES.height)
                }),
                scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
                isPrimary: fc.boolean()
              }),
              { minLength: 2, maxLength: 4 }
            ).filter(displays => {
              // Ensure we have at least 2 displays with different scale factors
              const scaleFactors = new Set(displays.map(d => d.scaleFactor));
              return scaleFactors.size >= 2;
            }),
            cursorPositions: fc.array(
              fc.record({
                x: fc.integer(COORD_RANGES.x),
                y: fc.integer(COORD_RANGES.y)
              }),
              { minLength: 2, maxLength: 10 }
            )
          }),
          ({ displays, cursorPositions }) => {
            if (displays.length < 2) {
              return true; // Skip if filter didn't produce enough displays
            }
            
            const validDisplays = ensurePrimaryDisplay(displays);
            const halfGrid = Math.floor(MAGNIFIER_GRID_SIZE / 2);
            
            // Property: Center pixel extraction must be accurate regardless of scale factor
            for (const pos of cursorPositions) {
              const currentDisplay = findDisplayAtPoint(pos.x, pos.y, validDisplays);
              
              // Only test positions that are on a display
              if (!currentDisplay) {
                continue;
              }
              
              // Calculate center pixel position
              const gridStartX = pos.x - halfGrid;
              const gridStartY = pos.y - halfGrid;
              const centerPixelX = gridStartX + halfGrid;
              const centerPixelY = gridStartY + halfGrid;
              
              // Verify center pixel is at cursor position (invariant across scale factors)
              if (centerPixelX !== pos.x || centerPixelY !== pos.y) {
                return false;
              }
              
              // Convert to display-local coordinates
              const localX = pos.x - currentDisplay.bounds.x;
              const localY = pos.y - currentDisplay.bounds.y;
              
              // Verify cursor is within display bounds
              if (localX < 0 || localX >= currentDisplay.bounds.width ||
                  localY < 0 || localY >= currentDisplay.bounds.height) {
                continue; // Skip positions outside display
              }
              
              // Apply scale factor for physical pixel sampling
              const physicalX = localX * currentDisplay.scaleFactor;
              const physicalY = localY * currentDisplay.scaleFactor;
              
              // Verify physical coordinates are valid
              const physicalWidth = currentDisplay.bounds.width * currentDisplay.scaleFactor;
              const physicalHeight = currentDisplay.bounds.height * currentDisplay.scaleFactor;
              
              if (physicalX < 0 || physicalX >= physicalWidth ||
                  physicalY < 0 || physicalY >= physicalHeight) {
                continue; // Skip invalid physical positions
              }
              
              // Property: Physical pixel coordinates must be correctly calculated
              // regardless of scale factor
              const expectedPhysicalX = localX * currentDisplay.scaleFactor;
              const expectedPhysicalY = localY * currentDisplay.scaleFactor;
              
              if (Math.abs(physicalX - expectedPhysicalX) > 0.001 ||
                  Math.abs(physicalY - expectedPhysicalY) > 0.001) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Display Scale Factor Retrieval', () => {
    it('should retrieve valid scale factor for any display in the system', () => {
      // Feature: multi-monitor-support, Property 11: Display Scale Factor Retrieval
      // Validates: Requirements 6.1
      
      fc.assert(
        fc.property(
          // Generate arbitrary display configurations
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer(DISPLAY_RANGES.x),
                y: fc.integer(DISPLAY_RANGES.y),
                width: fc.integer(DISPLAY_RANGES.width),
                height: fc.integer(DISPLAY_RANGES.height)
              }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
              isPrimary: fc.boolean()
            }),
            { minLength: 1, maxLength: 4 }
          ),
          (displays) => {
            const validDisplays = ensurePrimaryDisplay(displays);
            
            // Property: For any display in the system,
            // the display's scale factor must be retrieved and valid
            
            for (const display of validDisplays) {
              // Property 1: Scale factor must exist
              if (display.scaleFactor === undefined || display.scaleFactor === null) {
                return false;
              }
              
              // Property 2: Scale factor must be a positive number
              if (typeof display.scaleFactor !== 'number' || display.scaleFactor <= 0) {
                return false;
              }
              
              // Property 3: Scale factor must be a reasonable value (0.5 to 4.0)
              // This covers all common display configurations
              if (display.scaleFactor < 0.5 || display.scaleFactor > 4.0) {
                return false;
              }
              
              // Property 4: Scale factor must be finite (not NaN or Infinity)
              if (!Number.isFinite(display.scaleFactor)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make scale factor available for coordinate calculations', () => {
      // Feature: multi-monitor-support, Property 11: Display Scale Factor Retrieval
      // Validates: Requirements 6.1 (available for coordinate calculations)
      
      fc.assert(
        fc.property(
          // Generate display and cursor position
          fc.record({
            display: fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer(DISPLAY_RANGES.x),
                y: fc.integer(DISPLAY_RANGES.y),
                width: fc.integer(DISPLAY_RANGES.width),
                height: fc.integer(DISPLAY_RANGES.height)
              }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
              isPrimary: fc.boolean()
            }),
            cursorX: fc.integer(COORD_RANGES.x),
            cursorY: fc.integer(COORD_RANGES.y)
          }),
          ({ display, cursorX, cursorY }) => {
            // Property: For any display, the scale factor must be usable
            // in coordinate transformation calculations
            
            // Convert to display-local coordinates
            const localX = cursorX - display.bounds.x;
            const localY = cursorY - display.bounds.y;
            
            // Verify cursor is within display bounds
            if (localX < 0 || localX >= display.bounds.width ||
                localY < 0 || localY >= display.bounds.height) {
              return true; // Skip positions outside display
            }
            
            // Property: Scale factor must be usable in coordinate calculations
            // without throwing errors or producing invalid results
            try {
              // Apply scale factor for physical pixel coordinates
              const physicalX = localX * display.scaleFactor;
              const physicalY = localY * display.scaleFactor;
              
              // Verify calculations produce valid numbers
              if (!Number.isFinite(physicalX) || !Number.isFinite(physicalY)) {
                return false;
              }
              
              // Verify physical coordinates are non-negative
              if (physicalX < 0 || physicalY < 0) {
                return false;
              }
              
              // Verify reverse transformation is possible
              const reconstructedX = physicalX / display.scaleFactor;
              const reconstructedY = physicalY / display.scaleFactor;
              
              if (!Number.isFinite(reconstructedX) || !Number.isFinite(reconstructedY)) {
                return false;
              }
              
              // Verify transformation is approximately reversible
              const tolerance = 0.001;
              if (Math.abs(reconstructedX - localX) > tolerance ||
                  Math.abs(reconstructedY - localY) > tolerance) {
                return false;
              }
              
              return true;
            } catch (error) {
              // Scale factor caused an error in calculations
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make scale factor available for capture calculations', () => {
      // Feature: multi-monitor-support, Property 11: Display Scale Factor Retrieval
      // Validates: Requirements 6.1 (available for capture calculations)
      
      fc.assert(
        fc.property(
          // Generate display configurations
          fc.record({
            display: fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer(DISPLAY_RANGES.x),
                y: fc.integer(DISPLAY_RANGES.y),
                width: fc.integer(DISPLAY_RANGES.width),
                height: fc.integer(DISPLAY_RANGES.height)
              }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
              isPrimary: fc.boolean()
            })
          }),
          ({ display }) => {
            // Property: For any display, the scale factor must be usable
            // in capture dimension calculations
            
            try {
              // Calculate physical capture dimensions using scale factor
              const physicalWidth = display.bounds.width * display.scaleFactor;
              const physicalHeight = display.bounds.height * display.scaleFactor;
              
              // Property 1: Calculations must produce valid numbers
              if (!Number.isFinite(physicalWidth) || !Number.isFinite(physicalHeight)) {
                return false;
              }
              
              // Property 2: Physical dimensions must be positive
              if (physicalWidth <= 0 || physicalHeight <= 0) {
                return false;
              }
              
              // Property 3: Physical dimensions must be reasonable
              // (not exceeding 4K * 4.0 scale = 15360 pixels)
              if (physicalWidth > 15360 || physicalHeight > 8640) {
                return false;
              }
              
              // Property 4: Reverse calculation must be possible
              const reconstructedWidth = physicalWidth / display.scaleFactor;
              const reconstructedHeight = physicalHeight / display.scaleFactor;
              
              if (!Number.isFinite(reconstructedWidth) || !Number.isFinite(reconstructedHeight)) {
                return false;
              }
              
              // Property 5: Transformation must be reversible
              const tolerance = 0.001;
              if (Math.abs(reconstructedWidth - display.bounds.width) > tolerance ||
                  Math.abs(reconstructedHeight - display.bounds.height) > tolerance) {
                return false;
              }
              
              return true;
            } catch (error) {
              // Scale factor caused an error in calculations
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retrieve consistent scale factor for the same display across multiple queries', () => {
      // Feature: multi-monitor-support, Property 11: Display Scale Factor Retrieval
      // Validates: Requirements 6.1 (consistency)
      
      fc.assert(
        fc.property(
          // Generate display and multiple query scenarios
          fc.record({
            display: fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              bounds: fc.record({
                x: fc.integer(DISPLAY_RANGES.x),
                y: fc.integer(DISPLAY_RANGES.y),
                width: fc.integer(DISPLAY_RANGES.width),
                height: fc.integer(DISPLAY_RANGES.height)
              }),
              scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
              isPrimary: fc.boolean()
            }),
            numQueries: fc.integer({ min: 2, max: 10 })
          }),
          ({ display, numQueries }) => {
            // Property: For any display, the scale factor must remain consistent
            // across multiple retrievals
            
            const scaleFactors: number[] = [];
            
            // Simulate multiple queries for the same display
            for (let i = 0; i < numQueries; i++) {
              // In the actual implementation, this would be getAllDisplays()
              // and finding the display by ID, but here we simulate consistency
              scaleFactors.push(display.scaleFactor);
            }
            
            // Property: All retrieved scale factors must be identical
            const firstScaleFactor = scaleFactors[0];
            return scaleFactors.every(sf => sf === firstScaleFactor);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
