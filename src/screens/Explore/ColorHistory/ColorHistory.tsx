import React from "react";
import { type ColorFormat } from "../../../shared/color";
import { useFormattedHistory } from "../../../hooks";
import RainIcon from "../../../components/ui/RainIcon";

const HISTORY_MIN_HEIGHT = 150;
const HISTORY_MAX_HEIGHT = 180;
const HISTORY_ITEM_HEIGHT = 50;

interface ColorHistoryProps {
  history: ColorHistoryItem[];
  colorFormat: ColorFormat;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onColorClick: (hex: string) => void;
}

const ColorHistory: React.FC<ColorHistoryProps> = ({
  history,
  colorFormat,
  isExpanded,
  onToggleExpanded,
  onColorClick,
}) => {
  const formattedHistory = useFormattedHistory(history, colorFormat);

  return (
    <div
      className="px-6 py-3 flex flex-col min-h-0"
      style={{ WebkitAppRegion: "no-drag" }}
    >
      <button
        onClick={onToggleExpanded}
        className="flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
        aria-expanded={isExpanded}
        aria-controls="color-history-list"
      >
        <div className="text-xs text-slate-800 tracking-widest">
          COLOR HISTORY
        </div>
        <div className="text-slate-800 text-xs" aria-hidden="true">
          {isExpanded ? "▼" : "▶"}
        </div>
      </button>

      {isExpanded && (
        <>
          {formattedHistory.length > 0 ? (
            <ul
              id="color-history-list"
              className="space-y-1 overflow-y-auto pr-2 custom-scrollbar"
              style={{
                minHeight:
                  formattedHistory.length >= 3
                    ? `${HISTORY_MIN_HEIGHT}px`
                    : `${formattedHistory.length * HISTORY_ITEM_HEIGHT}px`,
                maxHeight: `${HISTORY_MAX_HEIGHT}px`,
              }}
              role="list"
            >
              {formattedHistory.map((item, index) => (
                <li key={`${item.hex}-${item.timestamp}-${index}`}>
                  <button
                    onClick={() => onColorClick(item.hex)}
                    className="w-full flex items-center gap-3 px-2 py-2 hover:bg-command-hover transition-colors group border-b border-command-border/10"
                    aria-label={`Copy color ${item.formatted}`}
                  >
                    <div
                      className="drag-handle text-command-muted text-xs"
                      aria-hidden="true"
                    >
                      ::
                    </div>
                    <RainIcon
                      color={item.hex}
                      size={24}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-xs font-bold text-command-text tracking-wide">
                        {item.formatted}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div
              id="color-history-list"
              className="text-slate-800 text-sm py-6 text-center tracking-wide"
              role="status"
            >
              No colors captured yet
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ColorHistory;
