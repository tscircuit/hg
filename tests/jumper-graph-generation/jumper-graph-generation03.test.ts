import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { generateJumperGrid } from "lib/JumperGraphSolver/jumper-graph-generator/generateJumperGrid"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"

test("jumper-graph-generation03", () => {
  const jumperGridTopology = generateJumperGrid({
    cols: 3,
    rows: 3,
    marginX: 2,
    marginY: 1,
    xChannelPointCount: 3,
    yChannelPointCount: 2,
  })

  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(jumperGridTopology)),
  ).toMatchSvgSnapshot(import.meta.path)
})
