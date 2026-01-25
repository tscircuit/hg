import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"
import { Topology } from "lib/topology"

test("topology10 - fractions spread", () => {
  const topo = new Topology()

  const A = topo.region("A").rect({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  const B = topo.region("B").rect({ minX: 1, maxX: 2, minY: 0, maxY: 1 })

  topo.connect(A, B).ports(3, { kind: "fractions", ts: [0.25, 0.5, 0.75] })

  const graph = topo.toJumperGraph()

  expect(graph.ports[0].d.y).toBeCloseTo(0.25, 5)
  expect(graph.ports[1].d.y).toBeCloseTo(0.5, 5)
  expect(graph.ports[2].d.y).toBeCloseTo(0.75, 5)

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(graph)),
  ).toMatchSvgSnapshot(import.meta.path)
})
