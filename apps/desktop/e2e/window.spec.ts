import { _electron as electron, expect, test } from '@playwright/test'

test('the app opens a window titled liminal', async () => {
  const app = await electron.launch({ args: ['.'] })
  const window = await app.firstWindow()

  await expect.poll(() => window.title()).toBe('liminal')

  await app.close()
})
