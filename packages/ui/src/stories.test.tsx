import { composeStories } from '@storybook/react-vite'
import { render } from '@testing-library/react'
import axe from 'axe-core'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { declaredPropNames } from './test/props.ts'

type StoryModule = Parameters<typeof composeStories>[0]

type PortableStory = ((props?: Record<string, unknown>) => ReactElement) & {
  argTypes: Record<string, unknown>
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>
}

const modules = import.meta.glob<StoryModule>('./**/*.stories.tsx', { eager: true })

const sources = import.meta.glob<string>('./*/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const JSDOM_CANNOT_MEASURE = { 'color-contrast': { enabled: false } }

for (const [path, module] of Object.entries(modules)) {
  const component = path.replace(/^.*\/([^/]+)\.stories\.tsx$/, '$1')
  const composed = composeStories(module)
  const stories = Object.entries(composed) as [string, PortableStory][]

  describe(component, () => {
    it('declares an argType for every prop its type declares', () => {
      const source = sources[`./${component}/${component}.tsx`]
      if (!source) throw new Error(`no source found for ${component}`)
      const declared = declaredPropNames(source, `${component}Props`)
      const first = stories[0]?.[1]
      if (!first) throw new Error(`${component} has no story`)
      const controlled = Object.keys(first.argTypes)
      expect(declared.filter((name) => !controlled.includes(name))).toEqual([])
    })

    it('has a named story for every state and variant', () => {
      expect(stories.length).toBeGreaterThan(1)
    })

    for (const [name, Story] of stories) {
      it(`${name} renders, plays its interaction and passes axe`, async () => {
        const { container } = render(<Story />)
        await Story.play?.({ canvasElement: container })
        const results = await axe.run(container, { rules: JSDOM_CANNOT_MEASURE })
        expect(results.violations.map((violation) => violation.id)).toEqual([])
      })
    }
  })
}
