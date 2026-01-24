import { expect, test } from "bun:test"
import { Topology, TopologyError } from "lib/topology"

test("topology07 - validation error for invalid bounds", () => {
  const topo = new Topology()

  topo.region("invalid").rect({ minX: 1, maxX: 0, minY: 0, maxY: 1 }) // minX > maxX

  expect(() => {
    topo.toJumperGraph()
  }).toThrow(TopologyError)
})
