import { useState, useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { JumperGraphSolver } from "lib/JumperGraphSolver/JumperGraphSolver"
import { convertSerializedHyperGraphToHyperGraph } from "lib/convertSerializedHyperGraphToHyperGraph"
import { convertSerializedConnectionsToConnections } from "lib/convertSerializedConnectionsToConnections"
import type { JPort, JRegion } from "lib/index"
import dataset from "../datasets/jumper-graph-solver/dataset01.json"

interface DatasetEntry {
  config: {
    numCrossings: number
    seed: number
    rows: number
    cols: number
    orientation: "vertical" | "horizontal"
  }
  problem: {
    graph: {
      ports: Array<{
        portId: string
        region1Id: string
        region2Id: string
        d: unknown
      }>
      regions: Array<{
        regionId: string
        pointIds: string[]
        d: unknown
      }>
    }
    connections: Array<{
      connectionId: string
      startRegionId: string
      endRegionId: string
    }>
  }
}

const typedDataset = dataset as DatasetEntry[]

export default () => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [key, setKey] = useState(0)

  const entry = typedDataset[selectedIndex]

  const problem = useMemo(() => {
    if (!entry) return null
    const graph = convertSerializedHyperGraphToHyperGraph(entry.problem.graph)
    const connections = convertSerializedConnectionsToConnections(
      entry.problem.connections,
      graph,
    )
    return { graph, connections }
  }, [selectedIndex])

  if (!entry || !problem) {
    return (
      <div style={{ padding: 20, fontFamily: "monospace" }}>
        No dataset loaded. Run the generator first:
        <pre>
          bun scripts/dataset-generation/generate-dataset01.ts --samples 10
        </pre>
      </div>
    )
  }

  const { config } = entry

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #ccc",
          background: "#f5f5f5",
          fontFamily: "monospace",
          fontSize: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <label>
            Sample:{" "}
            <input
              type="number"
              min={0}
              max={typedDataset.length - 1}
              value={selectedIndex}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 0 && val < typedDataset.length) {
                  setSelectedIndex(val)
                  setKey((k) => k + 1)
                }
              }}
              style={{ width: 60, marginRight: 5 }}
            />
            / {typedDataset.length - 1}
          </label>
          <button
            onClick={() => {
              setSelectedIndex(Math.max(0, selectedIndex - 1))
              setKey((k) => k + 1)
            }}
            disabled={selectedIndex === 0}
          >
            Prev
          </button>
          <button
            onClick={() => {
              setSelectedIndex(
                Math.min(typedDataset.length - 1, selectedIndex + 1),
              )
              setKey((k) => k + 1)
            }}
            disabled={selectedIndex === typedDataset.length - 1}
          >
            Next
          </button>
          <button
            onClick={() => {
              setSelectedIndex(Math.floor(Math.random() * typedDataset.length))
              setKey((k) => k + 1)
            }}
          >
            Random
          </button>
          <span style={{ marginLeft: 20 }}>
            <strong>Config:</strong> {config.rows}x{config.cols}{" "}
            {config.orientation}, {config.numCrossings} crossings, seed=
            {config.seed}
          </span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <GenericSolverDebugger
          key={key}
          createSolver={() =>
            new JumperGraphSolver({
              inputGraph: {
                regions: problem.graph.regions as JRegion[],
                ports: problem.graph.ports as unknown as JPort[],
              },
              inputConnections: problem.connections,
            })
          }
        />
      </div>
    </div>
  )
}
