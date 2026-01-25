import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology03 - center and size API", () => {
  const topo = new Topology()

  const pad = topo.region("pad").pad().center(0, 0).size(0.8, 0.45)
  const tj = topo.region("tj").throughJumper().center(0, 0).size(1.65, 0.3)

  // throughjumper ↔ pad ports with direct coordinate placement
  topo.port("TJ-PAD").between(tj, pad).at({ x: 0, y: 0 }).done()

  const graph = topo.toJumperGraph()

  expect(graph.regions).toHaveLength(2)
  expect(graph.ports).toHaveLength(1)

  const padRegion = graph.regions.find((r) => r.regionId === "pad")!
  expect(padRegion.d.isPad).toBe(true)
  expect(padRegion.d.bounds.minX).toBe(-0.4)
  expect(padRegion.d.bounds.maxX).toBe(0.4)

  const tjRegion = graph.regions.find((r) => r.regionId === "tj")!
  expect(tjRegion.d.isThroughJumper).toBe(true)

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
