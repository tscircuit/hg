import fs from "node:fs"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { generateSingleJumperRegions } from "../lib/JumperGraphSolver/generator"
import { visualizeJumperGraph } from "../lib/JumperGraphSolver/visualizeJumperGraph"

const singleJumperTopology = generateSingleJumperRegions({
  center: { x: 0, y: 0 },
  idPrefix: "singleJumper",
})
fs.writeFileSync(
  "singlejumper.svg",
  getSvgFromGraphicsObject(
    visualizeJumperGraph({
      ports: singleJumperTopology.ports,
      regions: singleJumperTopology.regions,
    }),
  ),
)
