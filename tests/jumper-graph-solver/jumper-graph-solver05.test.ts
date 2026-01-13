import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { JumperGraphSolver } from "lib/JumperGraphSolver/JumperGraphSolver"
import type { JPort, JRegion } from "lib/index"
import inputData from "./jumper-graph-solver05-input.json"

test.skip("jumper-graph-solver05: solve from pre-generated input", () => {
  const solver = new JumperGraphSolver({
    inputGraph: {
      regions: inputData.graph.regions as JRegion[],
      ports: inputData.graph.ports as unknown as JPort[],
    },
    inputConnections: inputData.connections,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(getSvgFromGraphicsObject(solver.visualize())).toMatchSvgSnapshot(
    import.meta.path,
  )
})
