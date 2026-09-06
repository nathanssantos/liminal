import type { z } from 'zod'

export type Direction = 'mainToRenderer' | 'rendererToMain'

export type Channel<
  Name extends string,
  Input extends z.ZodTypeAny,
  Output extends z.ZodTypeAny,
> = {
  name: Name
  direction: Direction
  input: Input
  output: Output
}

export type ChannelInput<C extends Channel<string, z.ZodTypeAny, z.ZodTypeAny>> = z.infer<
  C['input']
>

export type ChannelOutput<C extends Channel<string, z.ZodTypeAny, z.ZodTypeAny>> = z.infer<
  C['output']
>

export function defineChannel<
  Name extends string,
  Input extends z.ZodTypeAny,
  Output extends z.ZodTypeAny,
>(name: Name, direction: Direction, input: Input, output: Output): Channel<Name, Input, Output> {
  return { name, direction, input, output }
}
