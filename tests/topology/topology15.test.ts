import { expect, test } from "bun:test"
import { Topology } from "lib/topology"

test("topology15 - getRegion retrieves existing region", () => {
  const topo = new Topology()

  topo.region("myRegion").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })

  const ref = topo.getRegion("myRegion")
  expect(ref.id).toBe("myRegion")
})
