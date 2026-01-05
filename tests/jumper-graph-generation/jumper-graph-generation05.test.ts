import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { generateJumperX2Grid } from "lib/JumperGraphSolver/jumper-graph-generator/generateJumperX2Grid"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"

test("jumper-graph-generation05 - 0606x2 grid", () => {
  const jumperX2GridTopology = generateJumperX2Grid({
    cols: 3,
    rows: 3,
    marginX: 2,
    marginY: 1,
    xChannelPointCount: 3,
    yChannelPointCount: 2,
  })

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(jumperX2GridTopology)),
  ).toMatchSvgSnapshot(import.meta.path)
})
