import { describe, it, expect } from 'vitest';
import { rgbToHex, hexToRgb, getPixelFromImageData } from '../../src/shared/color';

describe('Color Utilities', () => {
  describe('rgbToHex', () => {
    it('should convert black (0, 0, 0) to #000000', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should convert white (255, 255, 255) to #FFFFFF', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
    });

    it('should convert mid-tone gray (128, 128, 128) to #808080', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
    });

    it('should convert red (255, 0, 0) to #FF0000', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
    });

    it('should convert green (0, 255, 0) to #00FF00', () => {
      expect(rgbToHex(0, 255, 0)).toBe('#00FF00');
    });

    it('should convert blue (0, 0, 255) to #0000FF', () => {
      expect(rgbToHex(0, 0, 255)).toBe('#0000FF');
    });

    it('should convert cyan (0, 255, 255) to #00FFFF', () => {
      expect(rgbToHex(0, 255, 255)).toBe('#00FFFF');
    });

    it('should convert magenta (255, 0, 255) to #FF00FF', () => {
      expect(rgbToHex(255, 0, 255)).toBe('#FF00FF');
    });

    it('should convert yellow (255, 255, 0) to #FFFF00', () => {
      expect(rgbToHex(255, 255, 0)).toBe('#FFFF00');
    });

    it('should pad single digit hex values with zero', () => {
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
    });

    it('should handle mixed single and double digit values', () => {
      expect(rgbToHex(15, 128, 255)).toBe('#0F80FF');
    });

    it('should produce uppercase hex values', () => {
      const hex = rgbToHex(171, 205, 239);
      expect(hex).toBe('#ABCDEF');
      expect(hex).not.toBe('#abcdef');
    });

    it('should handle various color combinations', () => {
      expect(rgbToHex(123, 45, 67)).toBe('#7B2D43');
      expect(rgbToHex(200, 100, 50)).toBe('#C86432');
      expect(rgbToHex(10, 20, 30)).toBe('#0A141E');
    });
  });

  describe('hexToRgb', () => {
    it('should convert #000000 to black (0, 0, 0)', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert #FFFFFF to white (255, 255, 255)', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert #808080 to mid-tone gray (128, 128, 128)', () => {
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
    });

    it('should convert #FF0000 to red (255, 0, 0)', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert #00FF00 to green (0, 255, 0)', () => {
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should convert #0000FF to blue (0, 0, 255)', () => {
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex values without # prefix', () => {
      expect(hexToRgb('FF5733')).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should handle lowercase hex values', () => {
      expect(hexToRgb('#abcdef')).toEqual({ r: 171, g: 205, b: 239 });
    });

    it('should handle uppercase hex values', () => {
      expect(hexToRgb('#ABCDEF')).toEqual({ r: 171, g: 205, b: 239 });
    });

    it('should handle mixed case hex values', () => {
      expect(hexToRgb('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239 });
    });

    it('should handle various color combinations', () => {
      expect(hexToRgb('#7B2D43')).toEqual({ r: 123, g: 45, b: 67 });
      expect(hexToRgb('#C86432')).toEqual({ r: 200, g: 100, b: 50 });
      expect(hexToRgb('#0A141E')).toEqual({ r: 10, g: 20, b: 30 });
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain values through RGB → HEX → RGB conversion', () => {
      const original = { r: 123, g: 45, b: 67 };
      const hex = rgbToHex(original.r, original.g, original.b);
      const result = hexToRgb(hex);
      expect(result).toEqual(original);
    });

    it('should maintain values through HEX → RGB → HEX conversion', () => {
      const original = '#A1B2C3';
      const rgb = hexToRgb(original);
      const result = rgbToHex(rgb.r, rgb.g, rgb.b);
      expect(result).toBe(original);
    });

    it('should handle edge case: minimum values (0, 0, 0)', () => {
      const hex = rgbToHex(0, 0, 0);
      const rgb = hexToRgb(hex);
      expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
      expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe('#000000');
    });

    it('should handle edge case: maximum values (255, 255, 255)', () => {
      const hex = rgbToHex(255, 255, 255);
      const rgb = hexToRgb(hex);
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
      expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe('#FFFFFF');
    });

    it('should handle multiple round-trips without degradation', () => {
      let r = 123, g = 45, b = 67;
      
      // Perform 5 round-trips
      for (let i = 0; i < 5; i++) {
        const hex = rgbToHex(r, g, b);
        const rgb = hexToRgb(hex);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
      }
      
      expect({ r, g, b }).toEqual({ r: 123, g: 45, b: 67 });
    });

    it('should handle round-trip for all primary and secondary colors', () => {
      const colors = [
        { r: 255, g: 0, b: 0 },     // Red
        { r: 0, g: 255, b: 0 },     // Green
        { r: 0, g: 0, b: 255 },     // Blue
        { r: 255, g: 255, b: 0 },   // Yellow
        { r: 255, g: 0, b: 255 },   // Magenta
        { r: 0, g: 255, b: 255 },   // Cyan
      ];

      colors.forEach(original => {
        const hex = rgbToHex(original.r, original.g, original.b);
        const result = hexToRgb(hex);
        expect(result).toEqual(original);
      });
    });
  });

  describe('getPixelFromImageData', () => {
    it('should extract RGB values from ImageData at specified coordinates', () => {
      // Create ImageData manually since we're in Node environment
      const width = 10;
      const height = 10;
      const data = new Uint8ClampedArray(width * height * 4);
      data[0] = 255;  // R
      data[1] = 128;  // G
      data[2] = 64;   // B
      data[3] = 255;  // A
      
      const imageData = { data, width, height } as ImageData;

      const pixel = getPixelFromImageData(imageData, 0, 0);
      expect(pixel).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should correctly calculate index for different positions', () => {
      const width = 7;
      const height = 7;
      const data = new Uint8ClampedArray(width * height * 4);
      const imageData = { data, width, height } as ImageData;
      
      const positions = [
        { x: 0, y: 0, r: 10, g: 20, b: 30 },
        { x: 3, y: 3, r: 40, g: 50, b: 60 },
        { x: 6, y: 6, r: 70, g: 80, b: 90 },
      ];

      positions.forEach(({ x, y, r, g, b }) => {
        const index = (y * 7 + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      });

      positions.forEach(({ x, y, r, g, b }) => {
        const pixel = getPixelFromImageData(imageData, x, y);
        expect(pixel).toEqual({ r, g, b });
      });
    });

    it('should handle edge cases (black and white pixels)', () => {
      const width = 5;
      const height = 5;
      const data = new Uint8ClampedArray(width * height * 4);
      const imageData = { data, width, height } as ImageData;
      
      // Black pixel (default initialization)
      expect(getPixelFromImageData(imageData, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
      
      // White pixel
      const whiteIndex = (2 * 5 + 2) * 4;
      data[whiteIndex] = 255;
      data[whiteIndex + 1] = 255;
      data[whiteIndex + 2] = 255;
      data[whiteIndex + 3] = 255;
      
      expect(getPixelFromImageData(imageData, 2, 2)).toEqual({ r: 255, g: 255, b: 255 });
    });
  });
});
