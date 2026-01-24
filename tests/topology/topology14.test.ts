import { expect, test } from "bun:test"
import { Topology } from "lib/topology"

test("topology14 - merge existing JumperGraph", () => {
  const topo1 = new Topology()
  const A = topo1.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo1.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })
  topo1.connect(A, B)
  const graph1 = topo1.toJumperGraph()

  const topo2 = new Topology()
  topo2.merge(graph1, { prefix: "merged" })

  const graph2 = topo2.toJumperGraph()

  expect(graph2.regions.map((r) => r.regionId)).toContain("merged:A")
  expect(graph2.regions.map((r) => r.regionId)).toContain("merged:B")
  expect(graph2.ports[0].portId).toBe("merged:A-B")
})
