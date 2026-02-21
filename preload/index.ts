import { contextBridge, ipcRenderer } from "electron";

export interface DisplayInfo {
	id: number;
	bounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	scaleFactor: number;
	isPrimary: boolean;
}

export interface DisplayCapture {
	displayId: number;
	dataUrl: string;
	width: number;
	height: number;
	scaleFactor: number;
	bounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export interface VirtualScreenBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface MultiDisplayCapture {
	displays: DisplayCapture[];
	virtualBounds: VirtualScreenBounds;
	timestamp: number;
}

export interface ColorHistoryItem {
	hex: string;
	timestamp: number;
}

export interface ElectronAPI {
	captureScreen: () => Promise<MultiDisplayCapture>;
	copyToClipboard: (text: string) => Promise<boolean>;
	closeCapture: () => void;
	startCapture: () => void;
	closeExplore: () => void;
	cancelCapture: () => void;
	quitApp: () => void;
	addColorToHistory: (hex: string) => Promise<void>;
	deleteColorFromHistory: (timestamp: number) => Promise<void>;
	setColorHistory: (history: ColorHistoryItem[]) => Promise<void>;
	getColorHistory: () => Promise<ColorHistoryItem[]>;
	onDisplaysChanged: (
		callback: (displays: DisplayInfo[]) => void,
	) => () => void;
	onHistoryUpdated: (
		callback: (history: ColorHistoryItem[]) => void,
	) => () => void;
	onCaptureEnded: (callback: () => void) => () => void;
	resizeExploreWindow: (width: number, height: number) => Promise<void>;
}

const electronAPI: ElectronAPI = {
	captureScreen: () => ipcRenderer.invoke("capture-screen"),
	copyToClipboard: (text: string) =>
		ipcRenderer.invoke("copy-to-clipboard", text),
	closeCapture: () => ipcRenderer.send("close-capture"),
	startCapture: () => ipcRenderer.send("start-capture"),
	closeExplore: () => ipcRenderer.send("close-explore"),
	cancelCapture: () => ipcRenderer.send("cancel-capture"),
	quitApp: () => ipcRenderer.send("quit-app"),
	addColorToHistory: (hex: string) =>
		ipcRenderer.invoke("add-color-to-history", hex),
	deleteColorFromHistory: (timestamp: number) =>
		ipcRenderer.invoke("delete-color-from-history", timestamp),
	setColorHistory: (history: ColorHistoryItem[]) =>
		ipcRenderer.invoke("set-color-history", history),
	getColorHistory: () => ipcRenderer.invoke("get-color-history"),
	resizeExploreWindow: (width: number, height: number) =>
		ipcRenderer.invoke("resize-explore-window", width, height),
	onDisplaysChanged: (callback: (displays: DisplayInfo[]) => void) => {
		const listener = (
			_event: Electron.IpcRendererEvent,
			displays: DisplayInfo[],
		) => {
			callback(displays);
		};
		ipcRenderer.on("displays-changed", listener);

		// Return cleanup function
		return () => {
			ipcRenderer.removeListener("displays-changed", listener);
		};
	},
	onHistoryUpdated: (callback: (history: ColorHistoryItem[]) => void) => {
		const listener = (
			_event: Electron.IpcRendererEvent,
			history: ColorHistoryItem[],
		) => {
			callback(history);
		};
		ipcRenderer.on("history-updated", listener);

		// Return cleanup function
		return () => {
			ipcRenderer.removeListener("history-updated", listener);
		};
	},
	onCaptureEnded: (callback: () => void) => {
		const listener = (_event: Electron.IpcRendererEvent) => {
			callback();
		};
		ipcRenderer.on("capture-ended", listener);

		return () => {
			ipcRenderer.removeListener("capture-ended", listener);
		};
	},
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
