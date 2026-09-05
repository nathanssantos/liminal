import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow } from 'electron'
import { mainWindowOptions } from './window.ts'

const here = dirname(fileURLToPath(import.meta.url))

function createWindow(): void {
  const window = new BrowserWindow(mainWindowOptions(join(here, '..', 'preload')))
  window.on('ready-to-show', () => window.show())

  const devServer = process.env.ELECTRON_RENDERER_URL
  if (devServer) {
    void window.loadURL(devServer)
    return
  }
  void window.loadFile(join(here, '..', 'renderer', 'index.html'))
}

void app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
