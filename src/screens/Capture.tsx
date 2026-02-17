import React, { useEffect, useState, useCallback, useRef } from "react";
import { Magnifier } from "../components/Magnifier";
import "../styles/glass.css";

export const Capture: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState("#000000");
  const [screenImage, setScreenImage] = useState<HTMLImageElement | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [copiedColor, setCopiedColor] = useState("");
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadScreenCapture = async () => {
      try {
        const { dataUrl } = await window.electronAPI.captureScreen();
        const img = new Image();
        img.onload = () => {
          setScreenImage(img);
        };
        img.src = dataUrl;
      } catch (error) {
        console.error("Failed to capture screen:", error);
        window.electronAPI.cancelCapture();
      }
    };

    loadScreenCapture();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleClick = useCallback(async () => {
    if (!screenImage) return;

    try {
      // Copy to clipboard
      await window.electronAPI.copyToClipboard(currentColor);

      // Show feedback
      setCopiedColor(currentColor);
      setShowFeedback(true);

      // Clear any existing timeout
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      // Hide feedback and close after 150ms
      feedbackTimeoutRef.current = setTimeout(() => {
        setShowFeedback(false);
        window.electronAPI.closeCapture();
      }, 2000);
    } catch (error) {
      console.error("Failed to copy color:", error);
      window.electronAPI.closeCapture();
    }
  }, [currentColor, screenImage]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      window.electronAPI.cancelCapture();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className="w-screen h-screen relative"
      style={{
        backgroundColor: "transparent",
        cursor: "crosshair",
      }}
      // className="w-screen h-screen relative pipette-cursor"
      // style={{ backgroundColor: "transparent" }}
    >
      {screenImage && (
        <Magnifier
          x={mousePos.x}
          y={mousePos.y}
          screenImage={screenImage}
          onColorChange={setCurrentColor}
        />
      )}

      {showFeedback && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="glass-dark px-6 py-3">
            <div className="text-white text-lg font-semibold">
              ✓ Copied {copiedColor}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
