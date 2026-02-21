import { useState, useCallback } from "react";

const COPY_FEEDBACK_DURATION = 3500;

/**
 * Custom hook to manage copy feedback state with automatic timeout
 * Returns the current feedback message and a function to trigger feedback
 */
export const useCopyFeedback = () => {
	const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

	const showCopyFeedback = useCallback(async (hex: string) => {
		try {
			await window.electronAPI.copyToClipboard(hex);
			setCopyFeedback(hex);
			setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_DURATION);
		} catch (error) {
			console.error("Failed to copy color to clipboard:", error);
		}
	}, []);

	return { copyFeedback, showCopyFeedback };
};
