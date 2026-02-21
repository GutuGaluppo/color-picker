import { ColorFormat } from "../../../shared/color";
import "./styles.css";

interface HeaderProps {
	colorFormat: ColorFormat;
	isCapturing: boolean;
	handleColorFormat: (format: ColorFormat) => void;
	handleStartCapture: () => void;
}

export default function Header({
	colorFormat,
	isCapturing,
	handleColorFormat,
	handleStartCapture,
}: HeaderProps) {
	return (
		<div className="px-6 py-4 command-section">
			<div className="flex items-end justify-between">
				<div>
					<div className="pb-4" style={{ WebkitAppRegion: "no-drag" }}>
						<button
							onClick={handleStartCapture}
							className="w-5 h-5 text-white rounded-full transition-colors font-medium bg-command-accent cursor-pointer"
							style={{
								WebkitAppRegion: "no-drag",
								backgroundColor: isCapturing ? "#15EA17" : "tomato",
							}}
						>
							°
						</button>
					</div>
					<h1 className="header-title" aria-label="Spectra Color Picker">
						SPECTRA
					</h1>
				</div>
				<div
					className="flex flex-col items-end gap-2"
					style={{ WebkitAppRegion: "no-drag" }}
				>
					<div className="header-buttons-title">CHOOSE FORMAT</div>
					<div
						className="flex"
						role="group"
						aria-label="Color format selection"
					>
						<button
							onClick={() => handleColorFormat("rgb")}
							className={`px-3 py-1 text-xs font-bold tracking-wide transition-colors rounded-tl-md rounded-bl-md ${
								colorFormat === "rgb"
									? "bg-slate-800 text-command-bg"
									: "command-button text-command-text"
							}`}
							aria-pressed={colorFormat === "rgb"}
						>
							RGB
						</button>
						<button
							onClick={() => handleColorFormat("hex")}
							className={`px-3 py-1 text-xs font-bold tracking-wide transition-colors border-x-0 ${
								colorFormat === "hex"
									? "bg-slate-800 text-command-bg border-x-0"
									: "command-button text-command-text border-x-0"
							}`}
							aria-pressed={colorFormat === "hex"}
						>
							HEX
						</button>
						<button
							onClick={() => handleColorFormat("hsl")}
							className={`px-3 py-1 text-xs font-bold tracking-wide transition-colors rounded-tr-md rounded-br-md ${
								colorFormat === "hsl"
									? "bg-slate-800 text-command-bg"
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
