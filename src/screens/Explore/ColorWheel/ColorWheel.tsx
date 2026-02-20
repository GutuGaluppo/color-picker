import React, { useRef, useEffect, useState } from "react";

interface ColorWheelProps {
  size?: number;
  onColorSelect?: (hex: string) => void;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ size = 240, onColorSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPos, setSelectedPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const physSize = size * dpr;
    canvas.width = physSize;
    canvas.height = physSize;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = physSize / 2;
    const centerY = physSize / 2;
    const radius = physSize / 2 - 1;

    const imageData = ctx.createImageData(physSize, physSize);
    const data = imageData.data;

    for (let y = 0; y < physSize; y++) {
      for (let x = 0; x < physSize; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          const angle = Math.atan2(dy, dx);
          const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
          const saturation = distance / radius;
          const [r, g, b] = hslToRgb(hue, saturation, 0.5);
          const idx = (y * physSize + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    if (selectedPos) {
      const physX = selectedPos.x * dpr;
      const physY = selectedPos.y * dpr;

      ctx.beginPath();
      ctx.arc(physX, physY, 7 * dpr, 0, 2 * Math.PI);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(physX, physY, 7 * dpr, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    }
  }, [size, selectedPos]);

  const pickColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = size / 2;
    const centerY = size / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = size / 2 - 1;

    if (distance > radius) return;

    const angle = Math.atan2(dy, dx);
    const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
    const saturation = distance / radius;
    const [r, g, b] = hslToRgb(hue, saturation, 0.5);
    const hex = rgbToHex(r, g, b);

    setSelectedPos({ x, y });
    onColorSelect?.(hex);
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Interactive color wheel for color selection"
      style={{ cursor: "crosshair", borderRadius: "50%", display: "block" }}
      onMouseDown={(e) => {
        isDraggingRef.current = true;
        pickColor(e);
      }}
      onMouseMove={(e) => {
        if (isDraggingRef.current) pickColor(e);
      }}
      onMouseUp={() => {
        isDraggingRef.current = false;
      }}
      onMouseLeave={() => {
        isDraggingRef.current = false;
      }}
    />
  );
};

export default ColorWheel;
