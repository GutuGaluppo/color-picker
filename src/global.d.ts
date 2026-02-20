export {};

declare global {
  interface DisplayInfo {
    id: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    scaleFactor: number;
    isPrimary: boolean;
  }

  interface DisplayCapture {
    displayId: number;
    dataUrl: string;
    width: number;
    height: number;
    scaleFactor: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  interface VirtualScreenBounds {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface MultiDisplayCapture {
    displays: DisplayCapture[];
    virtualBounds: VirtualScreenBounds;
    timestamp: number;
  }

  interface ColorHistoryItem {
    hex: string;
    timestamp: number;
  }

  interface Window {
    electronAPI: {
      captureScreen: () => Promise<MultiDisplayCapture>;
      copyToClipboard: (text: string) => Promise<boolean>;
      closeCapture: () => void;
      startCapture: () => void;
      closeExplore: () => void;
      cancelCapture: () => void;
      quitApp: () => void;
      addColorToHistory: (hex: string) => Promise<void>;
      getColorHistory: () => Promise<ColorHistoryItem[]>;
      onDisplaysChanged: (callback: (displays: DisplayInfo[]) => void) => () => void;
      onHistoryUpdated: (callback: (history: ColorHistoryItem[]) => void) => () => void;
    };
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}
