import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: { deps: { external: [/colours\.mjs$/] } },
    css: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/renderer/src/test-setup.ts'],
  },
})
