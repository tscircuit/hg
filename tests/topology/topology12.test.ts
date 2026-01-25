import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology12 - getPortIds returns port IDs", () => {
  const topo = new Topology()

  const A = topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })

  const portIds = topo.connect(A, B).idPrefix("A-B").ports(3).getPortIds()

  expect(portIds).toEqual(["A-B:0", "A-B:1", "A-B:2"])

  const graph = topo.toJumperGraph()
  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
