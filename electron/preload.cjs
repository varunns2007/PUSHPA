const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('pushpaDesktop', { platform: process.platform, electron: process.versions.electron });
