import React from "react";

export default function CloseButton() {
	return (
		<button
			onClick={() => window.electronAPI.quitApp()}
			className="hover:text-white transition-colors text-2xl text-command-bg font-extrabold leading-none"
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
