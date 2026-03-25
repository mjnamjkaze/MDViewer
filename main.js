const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.json'];

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let fileToOpen = null;

// Parse command line for file path (file association / Open With)
function getFileFromArgs(args) {
  // Skip electron executable and app path
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg && !arg.startsWith('-') && !arg.startsWith('--')) {
      const ext = path.extname(arg).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        return path.resolve(arg);
      }
    }
  }
  // Also check if last arg is a file path
  const lastArg = args[args.length - 1];
  if (lastArg && fs.existsSync(lastArg)) {
    const ext = path.extname(lastArg).toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(ext)) {
      return path.resolve(lastArg);
    }
  }
  return null;
}

// Determine file type from extension
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  return 'markdown';
}

// Check process.argv for file path
fileToOpen = getFileFromArgs(process.argv);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 500,
    minHeight: 400,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'default',
    show: false,
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (fileToOpen) {
      openFile(fileToOpen);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function openFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    const fileType = getFileType(filePath);
    const appName = fileType === 'json' ? 'MDViewer — JSON' : 'MDViewer';
    mainWindow.setTitle(`${fileName} — ${appName}`);
    mainWindow.webContents.send('file-opened', { content, fileName, filePath, dirPath, fileType });
  } catch (err) {
    console.error('Error reading file:', err);
  }
}

async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open File',
    filters: [
      { name: 'Supported Files', extensions: ['md', 'markdown', 'json'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    openFile(result.filePaths[0]);
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFileDialog()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('toggle-theme');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle JSON Format',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            mainWindow.webContents.send('toggle-json-format');
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.5));
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomFactor(1.0);
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MDViewer',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MDViewer',
              message: 'MDViewer v1.1.0',
              detail: 'A lightweight Markdown & JSON viewer for Windows.\n\nSupports CommonMark spec, syntax highlighting, tables, task lists, and beautiful JSON formatting.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('open-file-dialog', async () => {
  await openFileDialog();
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-file-to-open', () => {
  return fileToOpen;
});

// Handle second instance (when user double-clicks another file while app is open)
app.on('second-instance', (event, commandLine) => {
  const file = getFileFromArgs(commandLine);
  if (file && mainWindow) {
    openFile(file);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
