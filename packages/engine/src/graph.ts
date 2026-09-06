export type Disposable = { dispose: () => unknown }

export type NodeLedger = {
  add: <T extends Disposable>(node: T) => T
  pending: () => number
  disposed: () => number
  disposeAll: () => void
}

export function createLedger(): NodeLedger {
  const nodes = new Set<Disposable>()
  let disposed = 0
  return {
    add: <T extends Disposable>(node: T): T => {
      nodes.add(node)
      return node
    },
    pending: () => nodes.size,
    disposed: () => disposed,
    disposeAll: () => {
      const failures: unknown[] = []
      for (const node of nodes) {
        try {
          node.dispose()
        } catch (failure) {
          failures.push(failure)
        }
        disposed += 1
      }
      nodes.clear()
      if (failures.length > 0) {
        throw new AggregateError(failures, `${failures.length} nodes refused to be disposed`)
      }
    },
  }
}
