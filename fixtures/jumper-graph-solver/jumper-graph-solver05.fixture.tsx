import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { JumperGraphSolver } from "lib/JumperGraphSolver/JumperGraphSolver"
import type { JPort, JRegion } from "lib/index"
import inputData from "../../tests/jumper-graph-solver/jumper-graph-solver05-input.json"

export default () => {
  return (
    <GenericSolverDebugger
      createSolver={() =>
        new JumperGraphSolver({
          inputGraph: {
            regions: inputData.graph.regions as JRegion[],
            ports: inputData.graph.ports as unknown as JPort[],
          },
          inputConnections: inputData.connections,
        })
      }
    />
  )
}
