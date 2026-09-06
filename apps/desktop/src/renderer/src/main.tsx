import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Bridge } from '../../preload/bridge.ts'
import { App } from './App.tsx'
import { connect } from './live.ts'
import './index.css'

declare global {
  interface Window {
    liminal: Bridge
  }
}

const container = document.getElementById('root')
if (!container) throw new Error('the renderer root element is missing')

connect(window.liminal, navigator.mediaDevices)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
