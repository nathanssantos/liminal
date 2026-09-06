import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHANNELS, scoreLoad } from '@liminal/protocol'
import { sixteenBars } from '@liminal/score/fixtures'
import { app, BrowserWindow, ipcMain } from 'electron'
import { createSession } from './session.ts'
import { mainWindowOptions } from './window.ts'

const here = dirname(fileURLToPath(import.meta.url))

const session = createSession({
  directory: app.getPath('userData'),
  record: (event) => process.stdout.write(`${JSON.stringify(event)}\n`),
})

function listen(): void {
  for (const channel of CHANNELS.filter((given) => given.direction === 'rendererToMain')) {
    ipcMain.handle(channel.name, (_event, payload: unknown) =>
      session.handle(channel.name, payload),
    )
  }
}

function createWindow(): void {
  const window = new BrowserWindow(mainWindowOptions(join(here, '..', 'preload')))
  window.on('ready-to-show', () => window.show())
  window.webContents.on('did-finish-load', () => {
    window.webContents.send(scoreLoad.name, sixteenBars)
  })

  const devServer = process.env.ELECTRON_RENDERER_URL
  if (devServer) {
    void window.loadURL(devServer)
    return
  }
  void window.loadFile(join(here, '..', 'renderer', 'index.html'))
}

void app.whenReady().then(() => {
  listen()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
