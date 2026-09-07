import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Bridge } from '../../preload/bridge.ts'
import { App } from './App.tsx'
import { connect } from './live.ts'
import { BRIDGE_MISSING } from './notices.ts'
import { useShell } from './store.ts'
import './index.css'

declare global {
  interface Window {
    liminal: Bridge
  }
}

const container = document.getElementById('root')
if (!container) throw new Error('the renderer root element is missing')

if (window.liminal) {
  const live = connect(window.liminal, navigator.mediaDevices)
  window.addEventListener('pagehide', () => live.stop())
} else {
  useShell.getState().raise(BRIDGE_MISSING)
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
