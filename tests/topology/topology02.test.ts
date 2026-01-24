import { expect, test } from "bun:test"
import { Topology } from "lib/topology"

test("topology02 - multiple ports along shared edge", () => {
  const topo = new Topology()

  const A = topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })

  topo.connect(A, B).ports(3) // 3 evenly spaced ports

  const graph = topo.toJumperGraph()

  expect(graph.ports).toHaveLength(3)

  // Ports should be at t = 0.5/3, 1.5/3, 2.5/3 along the edge
  expect(graph.ports[0].d.x).toBe(1)
  expect(graph.ports[0].d.y).toBeCloseTo(1 / 6, 5)
  expect(graph.ports[1].d.y).toBeCloseTo(0.5, 5)
  expect(graph.ports[2].d.y).toBeCloseTo(5 / 6, 5)
})
