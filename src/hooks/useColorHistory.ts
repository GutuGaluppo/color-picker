import { useState, useEffect } from "react";

/**
 * Custom hook to manage color history state and IPC communication
 * Loads initial history and listens for updates from the main process
 */
export const useColorHistory = () => {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);

  useEffect(() => {
    // Load history on mount
    window.electronAPI
      .getColorHistory()
      .then(setHistory)
      .catch((error) => {
        console.error("Failed to load color history:", error);
        setHistory([]);
      });

    // Listen for history updates
    const cleanup = window.electronAPI.onHistoryUpdated((updatedHistory) => {
      setHistory(updatedHistory);
    });

    return cleanup;
  }, []);

  return history;
};
