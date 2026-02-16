import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  captureScreen: () => Promise<{ dataUrl: string; width: number; height: number }>;
  copyToClipboard: (text: string) => Promise<boolean>;
  closeCapture: () => void;
  startCapture: () => void;
  closeExplore: () => void;
  cancelCapture: () => void;
}

const electronAPI: ElectronAPI = {
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  closeCapture: () => ipcRenderer.send('close-capture'),
  startCapture: () => ipcRenderer.send('start-capture'),
  closeExplore: () => ipcRenderer.send('close-explore'),
  cancelCapture: () => ipcRenderer.send('cancel-capture'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
