import React from "react";
import "../styles/glass.css";

declare global {
  interface Window {
    electronAPI: {
      startCapture: () => void;
      closeExplore: () => void;
    };
  }
}

export const Explore: React.FC = () => {
  const handleStartCapture = () => {
    window.electronAPI.startCapture();
  };

  const handleClose = () => {
    window.electronAPI.closeExplore();
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="glass p-6 text-center">
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
        <div className="space-y-2">
          <button
            onClick={handleStartCapture}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            Start Capture
          </button>
          <div className="text-white text-xs opacity-70">
            or press Ctrl+Shift+C
          </div>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm mt-2"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
};
