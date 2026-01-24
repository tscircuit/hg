import { expect, test } from "bun:test"
import { Topology, TopologyError } from "lib/topology"

test("topology16 - getRegion throws for non-existent region", () => {
  const topo = new Topology()

  expect(() => {
    topo.getRegion("nonexistent")
  }).toThrow(TopologyError)
})
