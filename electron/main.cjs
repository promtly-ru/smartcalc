const { app, BrowserWindow, ipcMain, nativeTheme, shell } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL;

// Иконка окна и панели задач зависит от темы приложения (её присылает renderer)
const ICONS = {
  light: path.join(__dirname, 'icons', 'icon-light.ico'),
  dark: path.join(__dirname, 'icons', 'icon-dark.ico'),
};

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 620,
    minWidth: 320,
    minHeight: 480,
    frame: false,
    resizable: true,
    maximizable: false,
    backgroundColor: '#0a0a0a',
    show: false,
    title: 'SmartCalc',
    // До ответа renderer берём системную тему — с ней же приложение стартует впервые
    icon: nativeTheme.shouldUseDarkColors ? ICONS.dark : ICONS.light,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in the default browser instead of a new window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && DEV_URL) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('window:set-always-on-top', (_event, value) => {
  if (!mainWindow) return false;
  const onTop = Boolean(value);
  mainWindow.setAlwaysOnTop(onTop, 'floating');
  return onTop;
});

ipcMain.on('window:set-theme', (_event, theme) => {
  // setIcon есть только на Windows/Linux; на macOS иконка в Dock берётся из .app
  const icon = ICONS[theme];
  if (mainWindow && icon && process.platform !== 'darwin') mainWindow.setIcon(icon);
});

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:close', () => mainWindow?.close());

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
