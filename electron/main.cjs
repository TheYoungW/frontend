const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

let backendProcess = null

const isDev = !app.isPackaged

const getBackendPath = () => {
  if (isDev) {
    return path.join(__dirname, '..', 'app', 'synria_backend', 'synria_backend')
  }
  return path.join(process.resourcesPath, 'synria_backend', 'synria_backend')
}

const startBackend = () => {
  const backendPath = getBackendPath()
  if (!fs.existsSync(backendPath)) {
    console.error('[backend] binary not found:', backendPath)
    return
  }

  backendProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  backendProcess.stdout.on('data', (chunk) => {
    console.log('[backend]', chunk.toString())
  })

  backendProcess.stderr.on('data', (chunk) => {
    console.error('[backend]', chunk.toString())
  })

  backendProcess.on('exit', (code, signal) => {
    console.log('[backend] exit', { code, signal })
    backendProcess = null
  })
}

const stopBackend = () => {
  if (!backendProcess) return
  backendProcess.kill()
  backendProcess = null
}

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
    await mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
    await mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(() => {
  startBackend()
  return createWindow()
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopBackend()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
