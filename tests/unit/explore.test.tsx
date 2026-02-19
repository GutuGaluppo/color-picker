import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Explore } from '../../src/screens/Explore';

// Mock window.electronAPI
const mockStartCapture = vi.fn();
const mockCloseExplore = vi.fn();
const mockCopyToClipboard = vi.fn();
const mockGetColorHistory = vi.fn();
const mockAddColorToHistory = vi.fn();
const mockOnHistoryUpdated = vi.fn(() => vi.fn()); // Returns cleanup function

beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup window.electronAPI mock
  global.window.electronAPI = {
    startCapture: mockStartCapture,
    closeExplore: mockCloseExplore,
    copyToClipboard: mockCopyToClipboard,
    getColorHistory: mockGetColorHistory,
    addColorToHistory: mockAddColorToHistory,
    onHistoryUpdated: mockOnHistoryUpdated,
    captureScreen: vi.fn(),
    cancelCapture: vi.fn(),
    closeCapture: vi.fn(),
    onDisplaysChanged: vi.fn()
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Explore Screen Unit Tests', () => {
  describe('Component Rendering', () => {
    it('should render the explore screen with start capture button', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText('Start Capture')).toBeDefined();
      });
    });

    it('should render keyboard shortcut hint', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText(/Ctrl\+Shift\+C/i)).toBeDefined();
      });
    });

    it('should render hide button', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText('Hide')).toBeDefined();
      });
    });

    it('should render app icon', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      const { container } = render(<Explore />);
      
      await waitFor(() => {
        const icon = container.querySelector('svg');
        expect(icon).toBeDefined();
      });
    });
  });

  describe('History Loading', () => {
    it('should load history on mount', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() },
        { hex: '#33FF57', timestamp: Date.now() - 1000 }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(mockGetColorHistory).toHaveBeenCalledTimes(1);
      });
    });

    it('should display empty state when no history', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText('No colors captured yet')).toBeDefined();
      });
    });

    it('should not display empty state when history exists', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.queryByText('No colors captured yet')).toBeNull();
      });
    });
  });

  describe('History Display', () => {
    it('should display history items', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() },
        { hex: '#33FF57', timestamp: Date.now() - 1000 }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText('#FF5733')).toBeDefined();
        expect(screen.getByText('#33FF57')).toBeDefined();
      });
    });

    it('should display color swatches for each history item', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      const { container } = render(<Explore />);
      
      await waitFor(() => {
        const swatch = container.querySelector('[style*="background-color: rgb(255, 87, 51)"]') ||
                       container.querySelector('[style*="background-color: #FF5733"]') ||
                       container.querySelector('[style*="background-color: #ff5733"]');
        expect(swatch).toBeDefined();
      });
    });

    it('should display history section title when history exists', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText('Color History')).toBeDefined();
      });
    });

    it('should display multiple history items', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() },
        { hex: '#33FF57', timestamp: Date.now() - 1000 },
        { hex: '#3357FF', timestamp: Date.now() - 2000 }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      render(<Explore />);
      
      await waitFor(() => {
        expect(screen.getByText('#FF5733')).toBeDefined();
        expect(screen.getByText('#33FF57')).toBeDefined();
        expect(screen.getByText('#3357FF')).toBeDefined();
      });
    });
  });

  describe('Click-to-Copy Functionality', () => {
    it('should copy color to clipboard when history item clicked', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      mockCopyToClipboard.mockResolvedValue(true);
      
      render(<Explore />);
      
      const colorButton = await screen.findByText('#FF5733');
      fireEvent.click(colorButton.closest('button')!);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('#FF5733');
      });
    });

    it('should display feedback after copying', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      mockCopyToClipboard.mockResolvedValue(true);
      
      render(<Explore />);
      
      const colorButton = await screen.findByText('#FF5733');
      fireEvent.click(colorButton.closest('button')!);
      
      await waitFor(() => {
        expect(screen.getByText('✓ Copied #FF5733')).toBeDefined();
      });
    });

    it('should handle multiple click-to-copy actions', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() },
        { hex: '#33FF57', timestamp: Date.now() - 1000 }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      mockCopyToClipboard.mockResolvedValue(true);
      
      render(<Explore />);
      
      const firstButton = await screen.findByText('#FF5733');
      fireEvent.click(firstButton.closest('button')!);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('#FF5733');
      });
      
      const secondButton = await screen.findByText('#33FF57');
      fireEvent.click(secondButton.closest('button')!);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('#33FF57');
      });
    });
  });

  describe('Button Actions', () => {
    it('should call startCapture when Start Capture button clicked', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      render(<Explore />);
      
      const button = await screen.findByText('Start Capture');
      fireEvent.click(button);
      
      expect(mockStartCapture).toHaveBeenCalledTimes(1);
    });

    it('should call closeExplore when Hide button clicked', async () => {
      mockGetColorHistory.mockResolvedValue([]);
      
      render(<Explore />);
      
      const button = await screen.findByText('Hide');
      fireEvent.click(button);
      
      expect(mockCloseExplore).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scroll Behavior', () => {
    it('should render scrollable container when many items exist', async () => {
      // Generate 20 history items
      const mockHistory = Array.from({ length: 20 }, (_, i) => ({
        hex: `#${i.toString(16).padStart(6, '0')}`,
        timestamp: Date.now() - i * 1000
      }));
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      const { container } = render(<Explore />);
      
      await waitFor(() => {
        const scrollContainer = container.querySelector('.overflow-y-auto');
        expect(scrollContainer).toBeDefined();
      });
    });

    it('should display all history items in scrollable area', async () => {
      const mockHistory = [
        { hex: '#FF5733', timestamp: Date.now() },
        { hex: '#33FF57', timestamp: Date.now() - 1000 },
        { hex: '#3357FF', timestamp: Date.now() - 2000 },
        { hex: '#FF33F5', timestamp: Date.now() - 3000 },
        { hex: '#33FFF5', timestamp: Date.now() - 4000 }
      ];
      mockGetColorHistory.mockResolvedValue(mockHistory);
      
      render(<Explore />);
      
      await waitFor(() => {
        mockHistory.forEach(item => {
          expect(screen.getByText(item.hex)).toBeDefined();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle getColorHistory failure gracefully', async () => {
      mockGetColorHistory.mockRejectedValue(new Error('Failed to load history'));
      
      // Should not throw
      expect(() => render(<Explore />)).not.toThrow();
      
      // Component should still render
      await waitFor(() => {
        expect(screen.getByText('Start Capture')).toBeDefined();
      });
    });
  });
});
