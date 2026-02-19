import React, { useState, useEffect } from "react";
import "../styles/glass.css";

export const Explore: React.FC = () => {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Load history on mount
    window.electronAPI.getColorHistory().then(setHistory);
  }, []);

  const handleStartCapture = () => {
    window.electronAPI.startCapture();
  };

  const handleClose = () => {
    window.electronAPI.closeExplore();
  };

  const handleHistoryClick = async (hex: string) => {
    await window.electronAPI.copyToClipboard(hex);
    setCopyFeedback(hex);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="glass p-6 text-center flex flex-col max-h-[90vh]">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg m-auto mb-6">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L10 17.657"
            />
          </svg>
        </div>
        <div className="space-y-2 mb-4">
          <button
            onClick={handleStartCapture}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            Start Capture
          </button>
          <div className="text-white text-xs opacity-70">
            or press Ctrl+Shift+C
          </div>
        </div>

        {/* Color History Section */}
        {history.length > 0 ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="text-white text-sm font-medium mb-2 opacity-80">
              Color History
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
              {history.map((item, index) => (
                <button
                  key={`${item.hex}-${item.timestamp}-${index}`}
                  onClick={() => handleHistoryClick(item.hex)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded border-2 border-white/30 flex-shrink-0"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span className="text-white font-mono text-sm group-hover:text-blue-300 transition-colors">
                    {item.hex}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-white/50 text-xs py-4">
            No colors captured yet
          </div>
        )}

        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="mt-3 text-green-400 text-sm font-medium">
            ✓ Copied {copyFeedback}
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm mt-4"
        >
          Hide
        </button>
      </div>
    </div>
  );
};
