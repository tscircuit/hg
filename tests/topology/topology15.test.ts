import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology15 - getRegion retrieves existing region", () => {
  const topo = new Topology()

  topo.region("myRegion").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })

  const ref = topo.getRegion("myRegion")
  expect(ref.id).toBe("myRegion")

  const graph = topo.toJumperGraph()
  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
