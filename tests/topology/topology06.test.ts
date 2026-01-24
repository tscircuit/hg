import { expect, test } from "bun:test"
import { Topology, TopologyError } from "lib/topology"

test("topology06 - validation error for non-touching regions", () => {
  const topo = new Topology()

  const A = topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo.region("B").rect({ minX: 2, maxX: 3, minY: 0, maxY: 1 }) // gap between A and B

  expect(() => {
    topo.connect(A, B).ports(1)
  }).toThrow(TopologyError)
})
