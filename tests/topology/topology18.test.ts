import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology18 - metadata on regions", () => {
  const topo = new Topology()

  topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 }).meta({ customField: "value" })

  const graph = topo.toJumperGraph()
  expect((graph.regions[0].d as any).customField).toBe("value")

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
