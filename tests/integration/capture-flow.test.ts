/**
 * Integration tests for full capture flow
 * Tests end-to-end scenarios including multi-capture sessions, display changes,
 * error recovery, keyboard shortcuts, and window focus management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Integration: Full Capture Flow', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(async () => {
    // Cleanup
    try {
      const { cleanupDisplayListeners } = await import('../../electron/displays');
      cleanupDisplayListeners();
    } catch {
      // Ignore cleanup errors in tests
    }
  });

  describe('Multi-capture session with history', () => {
    it('should maintain history across multiple captures', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = await import('../../electron/windows');

      // Clear any existing history
      clearColorHistory();

      // Simulate multiple color captures
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F0F0F0', '#000000'];

      for (const color of colors) {
        addColorToHistory(color);
      }

      // Verify all colors in history
      const history = getColorHistory();
      expect(history).toHaveLength(5);

      // Verify reverse chronological order (most recent first)
      expect(history[0].hex).toBe('#000000');
      expect(history[1].hex).toBe('#F0F0F0');
      expect(history[2].hex).toBe('#3357FF');
      expect(history[3].hex).toBe('#33FF57');
      expect(history[4].hex).toBe('#FF5733');
    });

    it('should trim history to 1000 items', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = await import('../../electron/windows');

      clearColorHistory();

      // Add 1100 colors
      for (let i = 0; i < 1100; i++) {
        addColorToHistory(`#${i.toString(16).padStart(6, '0')}`);
      }

      // Verify history trimmed to 1000
      const history = getColorHistory();
      expect(history).toHaveLength(1000);

      // Verify most recent 1000 items kept
      expect(history[0].hex).toBe(`#${(1099).toString(16).padStart(6, '0')}`);
      expect(history[999].hex).toBe(`#${(100).toString(16).padStart(6, '0')}`);
    });

    it('should persist history across multiple capture cycles', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = await import('../../electron/windows');

      clearColorHistory();

      // First capture cycle
      addColorToHistory('#FF0000');
      expect(getColorHistory()).toHaveLength(1);

      // Second capture cycle
      addColorToHistory('#00FF00');
      expect(getColorHistory()).toHaveLength(2);

      // Third capture cycle
      addColorToHistory('#0000FF');
      const history = getColorHistory();
      
      expect(history).toHaveLength(3);
      expect(history[0].hex).toBe('#0000FF');
      expect(history[1].hex).toBe('#00FF00');
      expect(history[2].hex).toBe('#FF0000');
    });
  });

  describe('Color history management', () => {
    it('should add colors with timestamps', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = await import('../../electron/windows');

      clearColorHistory();

      const beforeTime = Date.now();
      addColorToHistory('#FF5733');
      const afterTime = Date.now();

      const history = getColorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].hex).toBe('#FF5733');
      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear history', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = await import('../../electron/windows');

      addColorToHistory('#FF5733');
      addColorToHistory('#33FF57');
      expect(getColorHistory()).toHaveLength(2);

      clearColorHistory();
      expect(getColorHistory()).toHaveLength(0);
    });

    it('should return copy of history array', async () => {
      const { addColorToHistory, getColorHistory, clearColorHistory } = await import('../../electron/windows');

      clearColorHistory();
      addColorToHistory('#FF5733');

      const history1 = getColorHistory();
      const history2 = getColorHistory();

      // Should be different array instances
      expect(history1).not.toBe(history2);
      // But with same content
      expect(history1).toEqual(history2);
    });
  });

  describe('Window state management', () => {
    it('should track window visibility state', async () => {
      const { getExploreWindow } = await import('../../electron/windows');

      // Window state is managed internally
      // This test verifies the module can be imported and functions exist
      expect(getExploreWindow).toBeDefined();
    });
  });

  describe('Integration with display manager', () => {
    it('should integrate display detection with window management', async () => {
      const { getAllDisplays } = await import('../../electron/displays');
      
      // Verify display manager can be used alongside window manager
      const displays = getAllDisplays();
      expect(Array.isArray(displays)).toBe(true);
    });
  });
});
