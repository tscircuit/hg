import { InteractiveGraphics } from "graphics-debug/react"
import { generateJumperGrid } from "lib/JumperGraphSolver/jumper-graph-generator/generateJumperGrid"
import { visualizeJumperGraph } from "lib/JumperGraphSolver/visualizeJumperGraph"

const jumperGridTopology = generateJumperGrid({
  cols: 3,
  rows: 3,
  marginX: 2,
  marginY: 1,
  // Channel points
  xChannelPointCount: 3,
  yChannelPointCount: 2,
  // paddingX
  // paddingY
})

const graphics = visualizeJumperGraph({
  ports: jumperGridTopology.ports,
  regions: jumperGridTopology.regions,
})

export default () => <InteractiveGraphics graphics={graphics} />
