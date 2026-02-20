import React from "react";

export default function CloseButton() {
  return (
    <button
      onClick={() => window.electronAPI.quitApp()}
      className="hover:text-slate-600 transition-colors text-2xl text-white leading-none"
      style={
        {
          WebkitAppRegion: "no-drag",
          cursor: "pointer",
        } as React.CSSProperties
      }
      title="Quit App"
    >
      ×
    </button>
  );
}
