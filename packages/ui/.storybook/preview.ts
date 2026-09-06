import type { Preview } from '@storybook/react-vite'
import '../src/tokens.css'

const VIEWPORTS = {
  narrow: { name: '1024', styles: { width: '1024px', height: '900px' }, type: 'desktop' as const },
  medium: { name: '1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' as const },
  wide: { name: '1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' as const },
}

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
    viewport: { value: 'medium' },
  },
  parameters: {
    layout: 'centered',
    viewport: { options: VIEWPORTS },
    a11y: { test: 'error' },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = String(context.globals.theme ?? 'dark')
      return Story()
    },
  ],
}

export default preview
