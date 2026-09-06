import { composeStories } from '@storybook/react-vite'
import { render } from '@testing-library/react'
import axe from 'axe-core'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { declaredPropNames } from './test/props.ts'

type StoryModule = Parameters<typeof composeStories>[0]

type ArgType = {
  control?: unknown
  options?: string[]
  description?: string
  table?: { defaultValue?: { summary?: string } }
}

type PortableStory = ((props?: Record<string, unknown>) => ReactElement) & {
  args: Record<string, unknown>
  argTypes: Record<string, ArgType>
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>
}

const modules = import.meta.glob<StoryModule>('./**/*.stories.tsx', { eager: true })

const sources = import.meta.glob<string>('./*/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const NOT_A_PAGE = {
  'color-contrast': { enabled: false },
  region: { enabled: false },
}

const ONLY_A_REAL_BROWSER_CAN_JUDGE = ['target-size']

const RADIX_HIDES_THE_PAGE_BEHIND_AN_OPEN_PANEL = ['aria-hidden-focus']

for (const [path, module] of Object.entries(modules)) {
  const component = path.replace(/^.*\/([^/]+)\.stories\.tsx$/, '$1')
  const composed = composeStories(module)
  const stories = Object.entries(composed) as [string, PortableStory][]

  describe(component, () => {
    const first = stories[0]?.[1]

    it('ships at least one story and the source its props are declared in', () => {
      expect(stories.length).toBeGreaterThan(0)
      expect(sources[`./${component}/${component}.tsx`]).toBeTruthy()
    })

    if (!first) return

    it('declares an argType for every prop its type declares', () => {
      const source = sources[`./${component}/${component}.tsx`]
      if (!source) throw new Error(`no source found for ${component}`)
      const declared = declaredPropNames(source, `${component}Props`)
      expect(declared.length).toBeGreaterThan(2)
      const controlled = Object.keys(first.argTypes)
      expect(declared.filter((name) => !controlled.includes(name))).toEqual([])
    })

    it('gives every prop a control, or says in words why it has none', () => {
      const withoutControl = Object.entries(first.argTypes).filter(
        ([, argType]) => argType.control === false && argType.description === undefined,
      )
      expect(withoutControl.map(([name]) => name)).toEqual([])
    })

    const variants = Object.entries(first.argTypes).filter(([, argType]) =>
      Array.isArray(argType.options),
    )

    it('has a named story for every value of every variant prop', () => {
      expect(variants.length).toBeGreaterThan(0)
      const covered = new Set(
        variants.flatMap(([prop, argType]) => {
          const byDefault = argType.table?.defaultValue?.summary
          if (byDefault === undefined) throw new Error(`${prop} declares no default in its argType`)
          return [
            `${prop}:${byDefault}`,
            ...stories
              .map(([, story]) => story.args[prop])
              .filter((value) => value !== undefined)
              .map((value) => `${prop}:${String(value)}`),
          ]
        }),
      )
      const missing = variants.flatMap(([prop, argType]) =>
        (argType.options ?? [])
          .filter((option) => !covered.has(`${prop}:${option}`))
          .map((option) => `${prop}=${option}`),
      )
      expect(missing).toEqual([])
    })

    for (const [name, Story] of stories) {
      it(`${name} renders, plays its interaction and passes axe`, async () => {
        const { container } = render(<Story />)
        await Story.play?.({ canvasElement: container })
        const results = await axe.run(document.body, { rules: NOT_A_PAGE })
        expect(results.violations.map((violation) => violation.id)).toEqual([])
        expect(
          results.incomplete
            .map((check) => check.id)
            .filter(
              (id) =>
                !ONLY_A_REAL_BROWSER_CAN_JUDGE.includes(id) &&
                !RADIX_HIDES_THE_PAGE_BEHIND_AN_OPEN_PANEL.includes(id),
            ),
        ).toEqual([])
      })
    }
  })
}
