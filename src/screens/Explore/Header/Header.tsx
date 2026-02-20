import { ColorFormat } from "../../../shared/color";

interface HeaderProps {
  colorFormat: ColorFormat;
  handleColorFormat: (format: ColorFormat) => void;
}

export default function Header({
  colorFormat,
  handleColorFormat,
}: HeaderProps) {
  return (
    <div className="px-6 py-4 command-section">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-800 tracking-widest mb-1">
            COLOR PICKER
          </div>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">
            SPECTRA
          </h1>
        </div>
        <div
          className="flex flex-col items-end gap-2"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <div className="text-xs text-command-muted tracking-widest">
            CHOOSE FORMAT
          </div>
          <div
            className="flex gap-2"
            role="group"
            aria-label="Color format selection"
          >
            <button
              onClick={() => handleColorFormat("rgb")}
              className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                colorFormat === "rgb"
                  ? "bg-slate-800 text-command-bg font-bold"
                  : "command-button text-command-text"
              }`}
              aria-pressed={colorFormat === "rgb"}
            >
              RGB
            </button>
            <button
              onClick={() => handleColorFormat("hex")}
              className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                colorFormat === "hex"
                  ? "bg-slate-800 text-command-bg font-bold"
                  : "command-button text-command-text"
              }`}
              aria-pressed={colorFormat === "hex"}
            >
              HEX
            </button>
            <button
              onClick={() => handleColorFormat("hsl")}
              className={`px-3 py-1 text-xs tracking-wide transition-colors ${
                colorFormat === "hsl"
                  ? "bg-slate-800 text-command-bg font-bold"
                  : "command-button text-command-text"
              }`}
              aria-pressed={colorFormat === "hsl"}
            >
              HSL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
