export type Rng = {
  next: () => number
  int: (max: number) => number
  pick: <T>(items: readonly [T, ...T[]]) => T
}

const UINT32 = 0x100000000

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const ULID_LENGTH = 26

const ULID_FIRST_CHAR_LIMIT = 8

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  if (state === 0) {
    state = 0x9e3779b9
  }
  const step = () => {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state
  }
  const next = () => step() / UINT32
  const int = (max: number) => {
    if (!Number.isInteger(max) || max < 1) {
      throw new RangeError(`int(max) needs an integer max ≥ 1, received ${max}`)
    }
    return Math.floor(next() * max)
  }
  return {
    next,
    int,
    pick: <T>(items: readonly [T, ...T[]]): T => items[int(items.length)] as T,
  }
}

export function newId(rng: Rng): string {
  const characters: string[] = [CROCKFORD.charAt(rng.int(ULID_FIRST_CHAR_LIMIT))]
  while (characters.length < ULID_LENGTH) {
    characters.push(CROCKFORD.charAt(rng.int(CROCKFORD.length)))
  }
  return characters.join('')
}
