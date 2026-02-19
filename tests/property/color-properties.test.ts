import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { rgbToHex, hexToRgb } from '../../src/shared/color';

describe('Color Conversion Properties', () => {
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
