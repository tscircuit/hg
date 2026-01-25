import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology13 - regions reference each other via ports", () => {
  const topo = new Topology()

  const A = topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })

  topo.connect(A, B)

  const graph = topo.toJumperGraph()

  const regionA = graph.regions.find((r) => r.regionId === "A")!
  const regionB = graph.regions.find((r) => r.regionId === "B")!
  const port = graph.ports[0]

  // Port is in both regions' port arrays
  expect(regionA.ports).toContain(port)
  expect(regionB.ports).toContain(port)

  // Port references are the actual region objects
  expect(port.region1).toBe(regionA)
  expect(port.region2).toBe(regionB)

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
