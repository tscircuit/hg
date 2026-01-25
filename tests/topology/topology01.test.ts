import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology01 - basic two region connect", () => {
  const topo = new Topology()

  const A = topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })

  topo.connect(A, B) // default: 1 port at boundary midpoint

  const graph = topo.toJumperGraph()

  expect(graph.regions).toHaveLength(2)
  expect(graph.ports).toHaveLength(1)

  // Port should be at x=1, y=0.5 (midpoint of shared vertical edge)
  expect(graph.ports[0].d.x).toBe(1)
  expect(graph.ports[0].d.y).toBe(0.5)

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
