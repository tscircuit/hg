import { expect, test } from "bun:test"
import { Topology } from "lib/topology"

test("topology04 - horizontal boundary", () => {
  const topo = new Topology()

  const top = topo.region("top").rect({ minX: 0, maxX: 2, minY: 1, maxY: 2 })
  const bottom = topo.region("bottom").rect({ minX: 0, maxX: 2, minY: 0, maxY: 1 })

  topo.connect(top, bottom).ports(2)

  const graph = topo.toJumperGraph()

  expect(graph.ports).toHaveLength(2)
  // Ports should be on horizontal boundary at y=1
  expect(graph.ports[0].d.y).toBe(1)
  expect(graph.ports[1].d.y).toBe(1)
})
