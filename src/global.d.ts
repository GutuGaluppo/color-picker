export {};

declare global {
  interface Window {
    electronAPI: {
      captureScreen: () => Promise<{ dataUrl: string; width: number; height: number }>;
      copyToClipboard: (text: string) => Promise<boolean>;
      closeCapture: () => void;
      startCapture: () => void;
      closeExplore: () => void;
      cancelCapture: () => void;
    };
  }
}
