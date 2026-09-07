import { contextBridge, ipcRenderer } from 'electron'
import { createBridge } from './bridge.ts'

contextBridge.exposeInMainWorld(
  'liminal',
  createBridge({
    invoke: (name, payload) => ipcRenderer.invoke(name, payload),
    subscribe: (name, listener) => {
      const wrapped = (_event: unknown, payload: unknown) => listener(payload)
      ipcRenderer.on(name, wrapped)
      return () => {
        ipcRenderer.off(name, wrapped)
      }
    },
  }),
)
