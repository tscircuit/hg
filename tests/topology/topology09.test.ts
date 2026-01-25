import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology09 - connection region", () => {
  const topo = new Topology()

  topo.region("conn").connectionRegion().center(0, 0).size(0.4, 0.4)

  const graph = topo.toJumperGraph()

  expect(graph.regions[0].d.isConnectionRegion).toBe(true)

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
