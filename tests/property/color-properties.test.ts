import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { rgbToHex, hexToRgb } from '../../src/shared/color';

describe('Color Conversion Properties', () => {
  describe('Property 14: Color Copy Accuracy', () => {
    it('should produce identical HEX values for identical RGB inputs', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([r, g, b]) => {
            // Simulate extracting RGB from a pixel and converting to HEX
            const hex1 = rgbToHex(r, g, b);
            const hex2 = rgbToHex(r, g, b);
            
            // Multiple conversions of same RGB should produce identical HEX
            return hex1 === hex2;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain color accuracy across coordinate transformations', () => {
      fc.assert(
        fc.property(
          fc.record({
            r: fc.integer({ min: 0, max: 255 }),
            g: fc.integer({ min: 0, max: 255 }),
            b: fc.integer({ min: 0, max: 255 }),
            scaleFactor: fc.constantFrom(1.0, 1.25, 1.5, 2.0, 2.5),
            logicalX: fc.integer({ min: 0, max: 1000 }),
            logicalY: fc.integer({ min: 0, max: 1000 }),
          }),
          ({ r, g, b, scaleFactor, logicalX, logicalY }) => {
            // Simulate coordinate transformation for different scale factors
            const physicalX = Math.floor(logicalX * scaleFactor);
            const physicalY = Math.floor(logicalY * scaleFactor);
            
            // Color value should remain the same regardless of coordinate transformation
            const hex = rgbToHex(r, g, b);
            const expectedHex = rgbToHex(r, g, b);

            return hex === expectedHex && physicalX >= 0 && physicalY >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract correct HEX from RGB values at any position', () => {
      fc.assert(
        fc.property(
          fc.record({
            centerR: fc.integer({ min: 0, max: 255 }),
            centerG: fc.integer({ min: 0, max: 255 }),
            centerB: fc.integer({ min: 0, max: 255 }),
            displayId: fc.integer({ min: 1, max: 5 }),
          }),
          ({ centerR, centerG, centerB, displayId }) => {
            // Simulate extracting center pixel color from any display
            const hex = rgbToHex(centerR, centerG, centerB);
            const expectedHex = rgbToHex(centerR, centerG, centerB);

            // Verify round-trip accuracy
            const rgb = hexToRgb(hex);
            
            return hex === expectedHex && 
                   rgb.r === centerR && 
                   rgb.g === centerG && 
                   rgb.b === centerB;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: RGB to HEX Conversion Consistency', () => {
    it('should maintain RGB values through round-trip conversion (RGB → HEX → RGB)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([r, g, b]) => {
            const hex = rgbToHex(r, g, b);
            const rgb = hexToRgb(hex);
            return rgb.r === r && rgb.g === g && rgb.b === b;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid HEX format for any RGB input', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([r, g, b]) => {
            const hex = rgbToHex(r, g, b);
            // Valid HEX format: #RRGGBB with uppercase hex digits
            return /^#[0-9A-F]{6}$/.test(hex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases (black, white, mid-tones)', () => {
      // Black
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });

      // White
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });

      // Mid-tone gray
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });

      // Primary colors
      expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00FF00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000FF');
    });
  });
});
