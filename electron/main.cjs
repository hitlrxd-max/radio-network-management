const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const { SerialPort } = require('serialport')

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  const url = process.env.ELECTRON_START_URL || 'http://localhost:3000'
  window.loadURL(url)
}

ipcMain.handle('radio:list-ports', async () => SerialPort.list())

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
