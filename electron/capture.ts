import { desktopCapturer, screen, clipboard } from 'electron';
import { rgbToHex } from '../src/shared/color';

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
}

export async function captureScreen(): Promise<CaptureResult> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  });

  if (sources.length === 0) {
    throw new Error('No screen sources available');
  }

  const dataUrl = sources[0].thumbnail.toDataURL();
  
  return {
    dataUrl,
    width,
    height
  };
}

export function getPixelColor(imageData: ImageData, x: number, y: number): string {
  const index = (y * imageData.width + x) * 4;
  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];
  
  return rgbToHex(r, g, b);
}

export function copyToClipboard(text: string): void {
  clipboard.writeText(text);
}
