import { expect, test } from "bun:test"
import { Topology, TopologyError } from "lib/topology"

test("topology08 - duplicate region ID error", () => {
  const topo = new Topology()

  topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })

  expect(() => {
    topo.region("A").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })
  }).toThrow(TopologyError)
})
