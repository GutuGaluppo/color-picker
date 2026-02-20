import React, { useState, useEffect, useMemo } from "react";
import { formatColor, type ColorFormat } from "../shared/color";
import "../styles/glass.css";

const MAX_HISTORY_ITEMS = 10;
const COPY_FEEDBACK_DURATION = 1500;
const HISTORY_MIN_HEIGHT = 150;
const HISTORY_MAX_HEIGHT = 180;
const HISTORY_ITEM_HEIGHT = 50;

export const Explore: React.FC = () => {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");

  useEffect(() => {
    // Load history on mount
    window.electronAPI
      .getColorHistory()
      .then(setHistory)
      .catch((error) => {
        console.error("Failed to load color history:", error);
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
    try {
      await window.electronAPI.copyToClipboard(hex);
      setCopyFeedback(hex);
      setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_DURATION);
    } catch (error) {
      console.error("Failed to copy color to clipboard:", error);
    }
  };

  // Memoize formatted history to avoid recalculating on every render
  const formattedHistory = useMemo(() => {
    return history.slice(0, MAX_HISTORY_ITEMS).map((item) => ({
      ...item,
      formatted: formatColor(item.hex, colorFormat),
    }));
  }, [history, colorFormat]);

  return (
    <div 
      className="w-full flex items-center justify-center p-2 pt-10 relative rounded-xl"
      style={{ background: '#f5f5dc' }}
    >
        {/* Close button at absolute top-right corner */}
        <div className="absolute top-0 right-0 w-full py-1 px-3 flex items-center justify-end z-[9999] bg-slate-950" >

        <button
          onClick={() => window.electronAPI.quitApp()}
          className="hover:text-slate-600 transition-colors text-2xl text-white leading-none"
          style={ { 
            WebkitAppRegion: "no-drag",
            cursor: "pointer"
          } as React.CSSProperties }
          title="Quit App"
          >
          ×
        </button>
          </div>
      <div
        className="command-container w-full h-full flex flex-col font-mono relative overflow-hidden"
        style={{ WebkitAppRegion: "drag" }}
      >
        
        {/* Header */}
        <div className="px-6 py-4 command-section">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-800 tracking-widest mb-1">
                COLOR PICKER
              </div>
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight">
                SPECTRA
              </h1>
            </div>
            <div
              className="flex flex-col items-end gap-2"
              style={{ WebkitAppRegion: "no-drag" }}
            >
              <div className="text-xs text-command-muted tracking-widest">
                CHOOSE FORMAT
              </div>
              <div
                className="flex gap-2"
                role="group"
                aria-label="Color format selection"
              >
                <button
                  onClick={() => setColorFormat("rgb")}
                  className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                    colorFormat === "rgb"
                      ? "bg-slate-800 text-command-bg font-bold"
                      : "command-button text-command-text"
                  }`}
                  aria-pressed={colorFormat === "rgb"}
                >
                  RGB
                </button>
                <button
                  onClick={() => setColorFormat("hex")}
                  className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                    colorFormat === "hex"
                      ? "bg-slate-800 text-command-bg font-bold"
                      : "command-button text-command-text"
                  }`}
                  aria-pressed={colorFormat === "hex"}
                >
                  HEX
                </button>
                <button
                  onClick={() => setColorFormat("hsl")}
                  className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                    colorFormat === "hsl"
                      ? "bg-slate-800 text-command-bg font-bold"
                      : "command-button text-command-text"
                  }`}
                  aria-pressed={colorFormat === "hsl"}
                >
                  HSL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Color History Section */}
        <div
          className="px-6 py-3 flex flex-col min-h-0"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
            aria-expanded={isHistoryExpanded}
            aria-controls="color-history-list"
          >
            <div className="text-xs text-slate-800 tracking-widest">
              COLOR HISTORY
            </div>
            <div className="text-slate-800 text-xs" aria-hidden="true">
              {isHistoryExpanded ? "▼" : "▶"}
            </div>
          </button>

          {isHistoryExpanded && (
            <>
              {formattedHistory.length > 0 ? (
                <ul
                  id="color-history-list"
                  className="space-y-1 overflow-y-auto pr-2 custom-scrollbar"
                  style={{
                    minHeight:
                      formattedHistory.length >= 3
                        ? `${HISTORY_MIN_HEIGHT}px`
                        : `${formattedHistory.length * HISTORY_ITEM_HEIGHT}px`,
                    maxHeight: `${HISTORY_MAX_HEIGHT}px`,
                  }}
                  role="list"
                >
                  {formattedHistory.map((item, index) => (
                    <li key={`${item.hex}-${item.timestamp}-${index}`}>
                      <button
                        onClick={() => handleHistoryClick(item.hex)}
                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-command-hover transition-colors group border-b border-command-border/10"
                        aria-label={`Copy color ${item.formatted}`}
                      >
                        <div
                          className="drag-handle text-command-muted text-xs"
                          aria-hidden="true"
                        >
                          ::
                        </div>
                        <div
                          className="w-8 h-8 border border-command-border/30 flex-shrink-0"
                          style={{ backgroundColor: item.hex }}
                          role="img"
                          aria-label={`Color swatch ${item.formatted}`}
                        />
                        <div className="flex-1 text-left">
                          <div className="text-xs font-bold text-command-text tracking-wide">
                            {item.formatted}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  id="color-history-list"
                  className="text-slate-800 text-sm py-6 text-center tracking-wide"
                  role="status"
                >
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
