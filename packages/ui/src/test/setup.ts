import '@testing-library/jest-dom/vitest'
import { setProjectAnnotations } from '@storybook/react-vite'
import { cleanup } from '@testing-library/react'
import { clearAllMocks } from 'storybook/test'
import { afterEach } from 'vitest'
import preview from '../../.storybook/preview.ts'

setProjectAnnotations([preview])

afterEach(() => {
  cleanup()
  clearAllMocks()
})

Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.DOMRect ??= class {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
  get top() {
    return this.y
  }
  get left() {
    return this.x
  }
  get right() {
    return this.x + this.width
  }
  get bottom() {
    return this.y + this.height
  }
  static fromRect(other?: DOMRectInit) {
    return new DOMRect(other?.x, other?.y, other?.width, other?.height)
  }
  toJSON() {
    return { ...this }
  }
}
