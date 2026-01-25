import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology05 - scope prefixing", () => {
  const topo = new Topology()

  topo.scope("cell_0_0", (cell) => {
    // pad from y=-0.25 to y=0.25, top from y=0.25 to y=1 (they share edge at y=0.25)
    const pad1 = cell.region("pad1").pad().center(0, 0).size(0.5, 0.5)
    const top = cell
      .region("T")
      .rect({ minX: -0.25, maxX: 0.25, minY: 0.25, maxY: 1 })

    cell.connect(top, pad1).idPrefix("T-P1").ports(1)
  })

  topo.scope("cell_0_1", (cell) => {
    // pad from y=-0.25 to y=0.25, top from y=0.25 to y=1 (they share edge at y=0.25)
    const pad1 = cell.region("pad1").pad().center(1.5, 0).size(0.5, 0.5)
    const top = cell
      .region("T")
      .rect({ minX: 1.25, maxX: 1.75, minY: 0.25, maxY: 1 })

    cell.connect(top, pad1).idPrefix("T-P1").ports(1)
  })

  const graph = topo.toJumperGraph()

  expect(graph.regions).toHaveLength(4)
  expect(graph.regions.map((r) => r.regionId)).toContain("cell_0_0:pad1")
  expect(graph.regions.map((r) => r.regionId)).toContain("cell_0_1:pad1")
  expect(graph.regions.map((r) => r.regionId)).toContain("cell_0_0:T")
  expect(graph.regions.map((r) => r.regionId)).toContain("cell_0_1:T")

  // Port IDs should be scoped
  expect(graph.ports.map((p) => p.portId)).toContain("cell_0_0:T-P1")
  expect(graph.ports.map((p) => p.portId)).toContain("cell_0_1:T-P1")

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
