import { InteractiveGraphics } from "graphics-debug/react"
import { generateSingleJumperRegions } from "lib/JumperGraphSolver/generator"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"

const singleJumperTopology = generateSingleJumperRegions({
  center: { x: 0, y: 0 },
  idPrefix: "singleJumper",
})

const graphics = visualizeJumperGraph({
  ports: singleJumperTopology.ports,
  regions: singleJumperTopology.regions,
})

export default () => <InteractiveGraphics graphics={graphics} />
