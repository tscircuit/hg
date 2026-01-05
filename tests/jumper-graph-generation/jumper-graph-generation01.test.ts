import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { generateSingleJumperRegions } from "lib/JumperGraphSolver/jumper-graph-generator/generateSingleJumperRegions"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"

test("jumper-graph-generation01", () => {
  const singleJumperTopology = generateSingleJumperRegions({
    center: { x: 0, y: 0 },
    idPrefix: "singleJumper",
  })
  expect(
    getSvgFromGraphicsObject(visualizeJumperGraph(singleJumperTopology)),
  ).toMatchSvgSnapshot(import.meta.path)
})
