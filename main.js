const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')

let mainWindow
let crackerProc = null
let pythonLauncher = null

function resolvePythonLauncher () {
  if (pythonLauncher) return pythonLauncher

  const candidates = process.platform === 'win32'
    ? [
        { command: 'py', args: ['-3'] },
        { command: 'python3', args: [] },
        { command: 'python', args: [] }
      ]
    : [
        { command: 'python3', args: [] },
        { command: 'python', args: [] }
      ]

  for (const candidate of candidates) {
    const check = spawnSync(candidate.command, [...candidate.args, '--version'], {
      encoding: 'utf8',
      windowsHide: true
    })

    if (!check.error && check.status === 0) {
      pythonLauncher = candidate
      return pythonLauncher
    }
  }

  return null
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 620,
    minWidth: 700,
    minHeight: 500,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f8f8f7',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'File Cracker — MDX Cyber Security Society'
  })

  Menu.setApplicationMenu(null)
  mainWindow.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Open wordlist file picker
ipcMain.handle('select-wordlist', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Wordlist', extensions: ['txt'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

// Open target file picker (fallback if drag-and-drop fails)
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  })
  return result.canceled ? null : result.filePaths[0]
})

// Run the cracker for the given file type
ipcMain.handle('start-crack', async (event, { filePath, wordlistPath, fileType }) => {
  const crackerScript = path.join(__dirname, 'crackers', `${fileType}.py`)
  const launcher = resolvePythonLauncher()

  if (!fs.existsSync(crackerScript)) {
    return { error: `No cracker found for .${fileType} — is crackers/${fileType}.py implemented?` }
  }

  if (!launcher) {
    return {
      error: 'Python 3 was not found. Install Python 3 and, on Windows, enable the py launcher or disable the Microsoft Store Python app execution alias.'
    }
  }

  return new Promise((resolve) => {
    const proc = spawn(
      launcher.command,
      [...launcher.args, crackerScript, '--file', filePath, '--wordlist', wordlistPath],
      { windowsHide: true }
    )
    crackerProc = proc

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim())
      lines.forEach(line => {
        // Forward each stdout line to the renderer
        mainWindow.webContents.send('crack-update', line.trim())
      })
    })

    proc.stderr.on('data', (data) => {
      mainWindow.webContents.send('crack-update', `ERROR:${data.toString().trim()}`)
    })

    proc.on('close', () => {
      crackerProc = null
      resolve({ done: true })
    })
    proc.on('error', (err) => {
      crackerProc = null
      if (err.code === 'ENOENT') {
        resolve({ error: 'Unable to start Python. Install Python 3 and ensure py/python is available in PATH.' })
        return
      }
      resolve({ error: err.message })
    })
  })
})

// Cancel the running cracker process
ipcMain.handle('cancel-crack', () => {
  if (crackerProc) {
    crackerProc.kill()
    crackerProc = null
  }
})
