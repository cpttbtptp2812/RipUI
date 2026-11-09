const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // 创建桌面纯透明、无边框、置顶小插件窗口
  mainWindow = new BrowserWindow({
    width: 320,
    height: 330,
    x: width - 340,
    y: height - 360,
    frame: false,             // 无系统标题栏
    transparent: true,       // 彻底透明背景
    alwaysOnTop: true,       // 常驻置顶
    resizable: true,
    hasShadow: false,        // 无系统黑边阴影
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const devUrl = 'http://localhost:5200';
  mainWindow.loadURL(devUrl);

  // 避免加载白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

