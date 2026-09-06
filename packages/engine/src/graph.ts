export type Disposable = { dispose: () => unknown }

export type NodeLedger = {
  add: <T extends Disposable>(node: T) => T
  pending: () => number
  disposeAll: () => void
}

export function createLedger(): NodeLedger {
  const nodes = new Set<Disposable>()
  return {
    add: <T extends Disposable>(node: T): T => {
      nodes.add(node)
      return node
    },
    pending: () => nodes.size,
    disposeAll: () => {
      for (const node of nodes) {
        node.dispose()
      }
      nodes.clear()
    },
  }
}
