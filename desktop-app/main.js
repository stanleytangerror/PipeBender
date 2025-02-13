const { app, BrowserWindow } = require("electron");
const path = require('node:path')
const isDev = import('electron-is-dev');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:3000/");
  } else {
    win.loadFile(path.join(__dirname, '../pipe-blender/public.index.html'));
  }
};

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})