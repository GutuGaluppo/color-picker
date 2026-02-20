import React, { useState, useEffect } from "react";
import "../styles/glass.css";

const MAX_HISTORY_ITEMS = 10;
const COPY_FEEDBACK_DURATION = 1500;

export const Explore: React.FC = () => {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [colorFormat, setColorFormat] = useState<'rgb' | 'hex' | 'hsl'>('hex');

  useEffect(() => {
    // Load history on mount
    window.electronAPI.getColorHistory()
      .then(setHistory)
      .catch((error) => {
        console.error('Failed to load color history:', error);
        // Set empty history on error
        setHistory([]);
      });

    // Listen for history updates
    const cleanup = window.electronAPI.onHistoryUpdated((updatedHistory) => {
      setHistory(updatedHistory);
    });

    // Start capture mode immediately on mount
    window.electronAPI.startCapture();

    return cleanup;
  }, []);

  const handleHistoryClick = async (hex: string) => {
    await window.electronAPI.copyToClipboard(hex);
    setCopyFeedback(hex);
    setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_DURATION);
  };

  // Convert HEX to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Convert HEX to HSL
  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  // Format color based on selected format
  const formatColor = (hex: string): string => {
    switch (colorFormat) {
      case 'rgb': return hexToRgb(hex);
      case 'hsl': return hexToHsl(hex);
      default: return hex.toUpperCase();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="command-container w-full flex flex-col font-mono" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {/* Header */}
        <div className="px-6 py-4 command-section">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-command-muted tracking-widest mb-1">
                COLOR PICKER
              </div>
              <h1 className="text-3xl font-bold text-command-accent tracking-tight">
                SPECTRA
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              <div className="text-xs text-command-muted tracking-widest">
                CHOOSE FORMAT
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setColorFormat('rgb')}
                  className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                    colorFormat === 'rgb'
                      ? 'bg-command-accent text-command-bg font-bold'
                      : 'command-button text-command-text'
                  }`}
                >
                  RGB
                </button>
                <button
                  onClick={() => setColorFormat('hex')}
                  className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                    colorFormat === 'hex'
                      ? 'bg-command-accent text-command-bg font-bold'
                      : 'command-button text-command-text'
                  }`}
                >
                  HEX
                </button>
                <button
                  onClick={() => setColorFormat('hsl')}
                  className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                    colorFormat === 'hsl'
                      ? 'bg-command-accent text-command-bg font-bold'
                      : 'command-button text-command-text'
                  }`}
                >
                  HSL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Color History Section */}
        <div className="px-6 py-3 flex flex-col min-h-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="text-xs text-command-muted tracking-widest">
              COLOR HISTORY
            </div>
            <div className="text-command-muted text-xs">
              {isHistoryExpanded ? '▼' : '▶'}
            </div>
          </button>

          {isHistoryExpanded && (
            <>
              {history.length > 0 ? (
                <div 
                  className="space-y-1 overflow-y-auto pr-2 custom-scrollbar"
                  style={{
                    minHeight: history.length >= 3 ? '150px' : `${history.length * 50}px`,
                    maxHeight: '180px'
                  }}
                >
                  {history.slice(0, MAX_HISTORY_ITEMS).map((item, index) => (
                    <button
                      key={`${item.hex}-${item.timestamp}-${index}`}
                      onClick={() => handleHistoryClick(item.hex)}
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-command-hover transition-colors group border-b border-command-border/10"
                    >
                      <div className="drag-handle text-command-muted text-xs">
                        ::
                      </div>
                      <div
                        className="w-8 h-8 border border-command-border/30 flex-shrink-0"
                        style={{ backgroundColor: item.hex }}
                      />
                      <div className="flex-1 text-left">
                        <div className="text-xs font-bold text-command-text tracking-wide">
                          {formatColor(item.hex)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-command-muted text-xs py-6 text-center tracking-wide">
                  No colors captured yet
                </div>
              )}
            </>
          )}
        </div>

        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="px-6 py-2 bg-command-accent text-command-bg text-xs font-bold tracking-widest text-center">
            ✓ COPIED {copyFeedback.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};
