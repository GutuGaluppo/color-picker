import React, { useEffect, useRef } from "react";
import { rgbToHex, getPixelFromImageData } from "../shared/color";

interface MagnifierProps {
  x: number;
  y: number;
  virtualBounds: VirtualScreenBounds;
  displayCapture: DisplayCapture | null;
  onColorChange: (color: string) => void;
}

const MAGNIFIER_SIZE = 120;
const GRID_SIZE = 7;
const CELL_SIZE = MAGNIFIER_SIZE / GRID_SIZE;
const OFFSET_X = 20;
const OFFSET_Y = 20;
const RADIUS = MAGNIFIER_SIZE / 2;

export const Magnifier: React.FC<MagnifierProps> = ({
  x,
  y,
  virtualBounds,
  displayCapture,
  onColorChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenImageRef = useRef<HTMLImageElement | null>(null);
  const [canvasError, setCanvasError] = React.useState(false);

  // Load display capture image
  useEffect(() => {
    if (!displayCapture) return;

    const img = new Image();
    img.onload = () => {
      screenImageRef.current = img;
    };
    img.onerror = () => {
      console.error('[Magnifier] Failed to load display capture image');
      screenImageRef.current = null;
    };
    img.src = displayCapture.dataUrl;

    return () => {
      screenImageRef.current = null;
    };
  }, [displayCapture]);

  useEffect(() => {
    if (!canvasRef.current || !displayCapture || !screenImageRef.current) {
      // Handle missing image data - display placeholder color
      if (!screenImageRef.current && displayCapture) {
        console.warn('[Magnifier] Image data not available, will retry on next render');
        onColorChange('#000000');
      }
      return;
    }

    const screenImage = screenImageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    // Handle canvas context creation failure
    if (!ctx) {
      console.error('[Magnifier] Failed to get canvas context');
      setCanvasError(true);
      onColorChange('#000000');
      return;
    }
    
    // Clear error state if context was successfully created
    if (canvasError) {
      setCanvasError(false);
    }

    // x/y are window-relative; add virtualBounds offset to get absolute
    // screen coords, then subtract the display's origin to get display-local.
    const localX = (x + virtualBounds.x) - displayCapture.bounds.x;
    const localY = (y + virtualBounds.y) - displayCapture.bounds.y;

    // Derive pixel scale from actual captured dimensions rather than scaleFactor.
    // Electron resizes thumbnails to fit within thumbnailSize, so the actual
    // capture ratio (captured px / logical px) may differ from scaleFactor.
    const xScale = displayCapture.width / displayCapture.bounds.width;
    const yScale = displayCapture.height / displayCapture.bounds.height;
    const scaledX = localX * xScale;
    const scaledY = localY * yScale;

    ctx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
    ctx.imageSmoothingEnabled = false;

    // =========================
    // 1. Circular clip mask
    // =========================
    ctx.save();
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
    ctx.clip();

    // =========================
    // 2. Calculate source region
    // =========================
    const halfGrid = Math.floor(GRID_SIZE / 2);
    const sourceX = Math.max(0, scaledX - halfGrid);
    const sourceY = Math.max(0, scaledY - halfGrid);

    try {
      ctx.drawImage(
        screenImage,
        sourceX,
        sourceY,
        GRID_SIZE,
        GRID_SIZE,
        0,
        0,
        MAGNIFIER_SIZE,
        MAGNIFIER_SIZE,
      );
    } catch (error) {
      console.error('[Magnifier] Failed to draw image:', error);
      onColorChange('#000000');
      return;
    }

    // =========================
    // 3. Draw grid
    // =========================
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, MAGNIFIER_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(MAGNIFIER_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.restore();

    // =========================
    // 4. Circular border
    // =========================
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS - 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // =========================
    // 5. Highlight center pixel
    // =========================
    const centerX = Math.floor(GRID_SIZE / 2) * CELL_SIZE;
    const centerY = Math.floor(GRID_SIZE / 2) * CELL_SIZE;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX, centerY, CELL_SIZE, CELL_SIZE);

    // =========================
    // 6. Read center pixel color
    // =========================
    try {
      const imageData = ctx.getImageData(
        centerX + CELL_SIZE / 2,
        centerY + CELL_SIZE / 2,
        1,
        1,
      );

      const pixel = getPixelFromImageData(imageData, 0, 0);
      const hexColor = rgbToHex(pixel.r, pixel.g, pixel.b);
      onColorChange(hexColor);
    } catch (error) {
      console.error('[Magnifier] Failed to read pixel color:', error);
      onColorChange('#000000');
    }
  }, [x, y, displayCapture, onColorChange, canvasError]);

  return (
    <div
      className="absolute glass-dark"
      style={{
        left: x + OFFSET_X,
        top: y + OFFSET_Y,
        width: MAGNIFIER_SIZE,
        height: MAGNIFIER_SIZE,
        borderRadius: "50%",
        pointerEvents: "none",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAGNIFIER_SIZE}
        height={MAGNIFIER_SIZE}
        className="w-full h-full rounded-full"
      />
    </div>
  );
};
