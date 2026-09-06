import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import type { Plugin } from 'vite'
import { CONTENT_SECURITY_POLICY, DEV_CONTENT_SECURITY_POLICY } from './src/main/window.ts'

const contentSecurityPolicy = (): Plugin => ({
  name: 'liminal:content-security-policy',
  transformIndexHtml: {
    order: 'pre',
    handler: (html: string, context: { server?: unknown }) =>
      html.replace(
        '%CONTENT_SECURITY_POLICY%',
        context.server ? DEV_CONTENT_SECURITY_POLICY : CONTENT_SECURITY_POLICY,
      ),
  },
})

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: 'src/main/index.ts',
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: false,
      rollupOptions: {
        input: 'src/preload/index.ts',
        output: { format: 'cjs', entryFileNames: 'index.cjs' },
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    build: {
      rollupOptions: {
        input: 'src/renderer/index.html',
      },
    },
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  },
})
