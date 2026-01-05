import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { generateJumperX4Grid } from "lib/JumperGraphSolver/jumper-graph-generator/generateJumperX4Grid"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"

test("jumper-graph-generation09 - 1206x4 grid with regionsBetweenPads", () => {
  const jumperX4Grid = generateJumperX4Grid({
    cols: 3,
    rows: 3,
    marginX: 1,
    marginY: 1,
    regionsBetweenPads: true,
    outerPaddingX: 2,
    outerPaddingY: 2,
  })
  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(jumperX4Grid)),
  ).toMatchSvgSnapshot(import.meta.path)
})
