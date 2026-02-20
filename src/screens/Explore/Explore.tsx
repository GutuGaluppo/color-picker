import React, { useState, useEffect } from "react";
import { type ColorFormat } from "../../shared/color";
import { useColorHistory, useCopyFeedback } from "../../hooks";
import "../../styles/glass.css";
import Header from "./Header";
import ColorHistory from "./ColorHistory";
import CloseButton from "../../components/ui/CloseButton";

const Explore: React.FC = () => {
  const history = useColorHistory();
  const { copyFeedback, showCopyFeedback } = useCopyFeedback();
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");

  useEffect(() => {
    // Start capture mode immediately on mount
    window.electronAPI.startCapture();
  }, []);

  const handleColorFormat = (format: ColorFormat) => {
    setColorFormat(format);
  };

  return (
    <div
      className="w-full flex items-center justify-center p-2 pt-10 relative rounded-xl"
      style={{ background: "#f5f5dc" }}
    >
      {/* Close button at absolute top-right corner */}
      <div className="absolute top-0 right-0 w-full py-1 px-3 flex items-center justify-end z-[9999] bg-slate-950" style={{ WebkitAppRegion: "drag" }}>
        <CloseButton />
      </div>
      <div
        className="command-container w-full h-full flex flex-col font-mono relative overflow-hidden"
        style={{ WebkitAppRegion: "drag" }}
      >
        {/* Header */}
        <Header colorFormat={colorFormat} handleColorFormat={handleColorFormat} />

        {/* Color History Section */}
        <ColorHistory
          history={history}
          colorFormat={colorFormat}
          isExpanded={isHistoryExpanded}
          onToggleExpanded={() => setIsHistoryExpanded(!isHistoryExpanded)}
          onColorClick={showCopyFeedback}
        />

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

export default Explore;
