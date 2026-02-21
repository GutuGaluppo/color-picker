import React, { useEffect, useState, useCallback, useRef } from "react";
import { Magnifier } from "../components/Magnifier";
import ColorPickerIcon from "../components/ui/ColorPickerIcon";
import "../styles/glass.css";

const FEEDBACK_DURATION = 1000;

/**
 * Helper function to find which display contains a given point
 */
const findDisplayAtPoint = (
	x: number,
	y: number,
	displays: DisplayCapture[],
): DisplayCapture | null => {
	for (const display of displays) {
		const { bounds } = display;
		if (
			x >= bounds.x &&
			x < bounds.x + bounds.width &&
			y >= bounds.y &&
			y < bounds.y + bounds.height
		) {
			return display;
		}
	}
	return null;
};

export const Capture: React.FC = () => {
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const [currentColor, setCurrentColor] = useState("#000000");
	const [captureData, setCaptureData] = useState<MultiDisplayCapture | null>(
		null,
	);
	const [currentDisplay, setCurrentDisplay] = useState<DisplayCapture | null>(
		null,
	);
	const [showFeedback, setShowFeedback] = useState(false);
	const [copiedColor, setCopiedColor] = useState("");
	const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const loadScreenCapture = async () => {
			try {
				const multiCapture = await window.electronAPI.captureScreen();
				setCaptureData(multiCapture);
			} catch (error) {
				console.error("Failed to capture screen:", error);
				window.electronAPI.cancelCapture();
			}
		};

		loadScreenCapture();
	}, []);

	// Determine current display from cursor position
	useEffect(() => {
		if (captureData && mousePos) {
			const display = findDisplayAtPoint(
				mousePos.x,
				mousePos.y,
				captureData.displays,
			);
			setCurrentDisplay(display);
		}
	}, [mousePos, captureData]);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		setMousePos({ x: e.clientX, y: e.clientY });
	}, []);

	const handleClick = useCallback(async () => {
		if (!currentDisplay) return;

		try {
			// Copy to clipboard
			await window.electronAPI.copyToClipboard(currentColor);

			// Add to history
			await window.electronAPI.addColorToHistory(currentColor);

			// Show feedback
			setCopiedColor(currentColor);
			setShowFeedback(true);

			// Clear any existing timeout
			if (feedbackTimeoutRef.current) {
				clearTimeout(feedbackTimeoutRef.current);
			}

			// Hide feedback after duration, but keep capture active
			feedbackTimeoutRef.current = setTimeout(() => {
				setShowFeedback(false);
			}, FEEDBACK_DURATION);
		} catch (error) {
			console.error("Failed to copy color:", error);
		}
	}, [currentColor, currentDisplay]);

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
				cursor: "none",
			}}
		>
			{/* Custom cursor */}
			<div
				className="fixed pointer-events-none z-50"
				style={{
					left: mousePos.x,
					top: mousePos.y,
					transform: "translate(-12px, -12px)",
				}}
			>
				<ColorPickerIcon size={24} color={currentColor} />
			</div>

			{currentDisplay && (
				<Magnifier
					x={mousePos.x}
					y={mousePos.y}
					displayCapture={currentDisplay}
					onColorChange={setCurrentColor}
				/>
			)}

			{showFeedback && (
				<div
					className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
					role="status"
					aria-live="polite"
				>
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
