const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('radioDesktop', {
  listPorts: () => ipcRenderer.invoke('radio:list-ports'),
})
