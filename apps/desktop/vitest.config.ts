import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: { deps: { external: [/colours\.mjs$/] } },
    css: true,
    include: ['src/**/*.test.ts'],
  },
})
