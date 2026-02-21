import React from "react";
import { type ColorFormat } from "../../../shared/color";
import { useFormattedHistory } from "../../../hooks";
import RainIcon from "../../../components/ui/RainIcon";
import listItemIcon from "../../../components/ui/drag-and-drop.png";
import pantone from "../../../components/ui/pantone-colored.png";
import trashIcon from "../../../components/ui/delete.png";
import "./styles.css";

const HISTORY_MIN_HEIGHT = 150;
const HISTORY_MAX_HEIGHT = 180;
const HISTORY_ITEM_HEIGHT = 50;

interface ColorHistoryProps {
	history: ColorHistoryItem[];
	colorFormat: ColorFormat;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	onColorClick: (hex: string) => void;
	deleteColorFromHistory: (timestamp: number) => void;
}

const ColorHistory: React.FC<ColorHistoryProps> = ({
	history,
	colorFormat,
	isExpanded,
	onToggleExpanded,
	onColorClick,
	deleteColorFromHistory,
}) => {
	const formattedHistory = useFormattedHistory(history, colorFormat);

	const handlePluralize = () => {
		const count = formattedHistory.length;
		return `${count} ${count === 1 ? "color" : "colors"}`;
	};

	return (
		<div
			className="px-6 py-3 flex flex-col min-h-0"
			style={{ WebkitAppRegion: "no-drag" }}
		>
			<button
				onClick={onToggleExpanded}
				className="flex items-baseline justify-between mb-2 hover:opacity-80 transition-opacity"
				aria-expanded={isExpanded}
				aria-controls="color-history-list"
			>
				<div className="title tracking-wide" aria-hidden="true">
					COLOR HISTORY
				</div>
				{formattedHistory.length > 0 && (
					<span className="title ml-4">{handlePluralize()}</span>
				)}
				<img src={pantone} className="w-5 h-5 mr-auto ml-3" />
				<div className="text-slate-800 text-md" aria-hidden="true">
					{isExpanded ? "▲" : "▼"}
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
							{formattedHistory.map((item, index) => {
								return (
									<li
										key={`${item.hex}-${item.timestamp}-${index}`}
										className="flex items-center justify-between"
										role="listitem"
									>
										<div className="flex items-center gap-3 px-2 py-2 rounded group hover:bg-command-hover transition-colors w-full">
											<button
												onClick={() => onColorClick(item.formatted)}
												className="w-full flex items-center gap-3 px-2 py-2 hover:bg-command-hover transition-colors group border-b border-command-border/10"
												aria-label={`Copy color ${item.formatted}`}
											>
												<img
													src={listItemIcon}
													className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
												/>
												<RainIcon
													color={item.hex}
													size={24}
													className="flex-shrink-0"
												/>
												<div className="flex-1 text-left">
													<div className="text-sm font-bold text-command-text tracking-wide">
														{item.formatted}
													</div>
												</div>
											</button>
											<button
												onClick={() => deleteColorFromHistory(item.timestamp)}
												className="ml-2 p-1 rounded hover:bg-red-600/10 transition-colors"
												aria-label={`Delete color ${item.formatted} from history`}
											>
												<img
													src={trashIcon}
													className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity"
												/>
											</button>
										</div>
									</li>
								);
							})}
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
