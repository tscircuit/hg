import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology17 - connect by string IDs", () => {
  const topo = new Topology()

  topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  topo.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })

  topo.connect("A", "B")

  const graph = topo.toJumperGraph()
  expect(graph.ports).toHaveLength(1)

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
