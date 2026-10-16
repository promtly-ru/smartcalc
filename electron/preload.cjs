const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (value) => ipcRenderer.invoke('window:set-always-on-top', value),
  setTheme: (theme) => ipcRenderer.send('window:set-theme', theme),
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  platform: process.platform,
});
