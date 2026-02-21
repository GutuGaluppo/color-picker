import React, { useCallback, useEffect, useState } from "react";
import CloseButton from "../../components/ui/CloseButton";
import { useColorHistory, useCopyFeedback } from "../../hooks";
import { type ColorFormat } from "../../shared/color";
import "../../styles/glass.css";
import ColorHistory from "./ColorHistory";
import ColorWheel from "./ColorWheel/ColorWheel";
import Drawer from "./Drawer/Drawer";
import DrawerTab from "./DrawerTab/DrawerTab";
import Header from "./Header";

const WINDOW_BASE_WIDTH = 400;
const WINDOW_HEIGHT = 400;
const DRAWER_WIDTH = 320;

const Explore: React.FC = () => {
	const history = useColorHistory();
	const { copyFeedback, showCopyFeedback } = useCopyFeedback();
	const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
	const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isCapturing, setIsCapturing] = useState(false);

	useEffect(() => {
		// Start capture mode immediately on mount
		window.electronAPI.startCapture();
		setIsCapturing(true);
	}, []);

	useEffect(() => {
		return window.electronAPI.onCaptureEnded(() => {
			setIsCapturing(false);
		});
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isCapturing) {
				window.electronAPI.cancelCapture();
				setIsCapturing(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isCapturing]);

	const handleColorFormat = (format: ColorFormat) => {
		setColorFormat(format);
	};

	const handleColorWheelSelect = async (hex: string) => {
		await window.electronAPI.addColorToHistory(hex);
		await window.electronAPI.copyToClipboard(hex);
		showCopyFeedback(hex);
	};

	const handleStartCapture = useCallback(() => {
		window.electronAPI.startCapture();
		setIsCapturing(true);
	}, []);

	const deleteColorFromHistory = async (timestamp: number) => {
		await window.electronAPI.deleteColorFromHistory(timestamp);
	};

	const toggleDrawer = () => {
		if (!isDrawerOpen) {
			window.electronAPI.resizeExploreWindow(
				WINDOW_BASE_WIDTH + DRAWER_WIDTH,
				WINDOW_HEIGHT,
			);
			setIsDrawerOpen(true);
		} else {
			setIsDrawerOpen(false);
			window.electronAPI.resizeExploreWindow(WINDOW_BASE_WIDTH, WINDOW_HEIGHT);
		}
	};

	return (
		<div
			className="w-full flex items-center justify-center p-2 pt-10 relative rounded-xl"
			style={{ background: "#f5f5dc" }}
		>
			{/* Close button at absolute top-right corner */}
			<div
				className="absolute top-0 right-0 w-full py-1 px-3 flex items-center justify-end z-[9999] bg-slate-950"
				style={{ WebkitAppRegion: "drag" }}
			>
				{copyFeedback && (
					<div className="px-6 py-0 bg-command-accent text-command-bg text-xs font-bold tracking-widest text-center">
						✓ COPIED {copyFeedback.toUpperCase()}
					</div>
				)}
				<CloseButton />
			</div>
			<div
				className="command-container w-full h-full min-h-40 flex flex-row font-mono relative overflow-hidden"
				style={{ WebkitAppRegion: "drag" }}
			>
				{/* Left: existing content */}
				<div className="flex flex-col flex-1 overflow-hidden">
					<Header
						colorFormat={colorFormat}
						handleColorFormat={handleColorFormat}
						isCapturing={isCapturing}
						handleStartCapture={handleStartCapture}
					/>

					<ColorHistory
						history={history}
						colorFormat={colorFormat}
						isExpanded={isHistoryExpanded}
						onToggleExpanded={() => setIsHistoryExpanded(!isHistoryExpanded)}
						onColorClick={showCopyFeedback}
						deleteColorFromHistory={deleteColorFromHistory}
					/>
				</div>

				{/* Color Wheel Drawer */}
				<Drawer isOpen={isDrawerOpen}>
					{isDrawerOpen && (
						<ColorWheel size={240} onColorSelect={handleColorWheelSelect} />
					)}
				</Drawer>
				{/* Color Wheel Drawer Tab */}
				<DrawerTab isOpen={isDrawerOpen} onClick={toggleDrawer} />
			</div>
		</div>
	);
};

export default Explore;
