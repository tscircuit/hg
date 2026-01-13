import { useState, useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { JumperGraphSolver } from "lib/JumperGraphSolver/JumperGraphSolver"
import { convertSerializedHyperGraphToHyperGraph } from "lib/convertSerializedHyperGraphToHyperGraph"
import { convertSerializedConnectionsToConnections } from "lib/convertSerializedConnectionsToConnections"
import type { JPort, JRegion } from "lib/index"
import sample0001 from "../datasets/jumper-graph-solver/dataset01/samples/sample0001.json"
import sample0002 from "../datasets/jumper-graph-solver/dataset01/samples/sample0002.json"
import sample0003 from "../datasets/jumper-graph-solver/dataset01/samples/sample0003.json"
import sample0004 from "../datasets/jumper-graph-solver/dataset01/samples/sample0004.json"
import sample0005 from "../datasets/jumper-graph-solver/dataset01/samples/sample0005.json"
import sample0006 from "../datasets/jumper-graph-solver/dataset01/samples/sample0006.json"
import sample0007 from "../datasets/jumper-graph-solver/dataset01/samples/sample0007.json"
import sample0008 from "../datasets/jumper-graph-solver/dataset01/samples/sample0008.json"
import sample0009 from "../datasets/jumper-graph-solver/dataset01/samples/sample0009.json"
import sample0010 from "../datasets/jumper-graph-solver/dataset01/samples/sample0010.json"
import sample0011 from "../datasets/jumper-graph-solver/dataset01/samples/sample0011.json"
import sample0012 from "../datasets/jumper-graph-solver/dataset01/samples/sample0012.json"
import sample0013 from "../datasets/jumper-graph-solver/dataset01/samples/sample0013.json"
import sample0014 from "../datasets/jumper-graph-solver/dataset01/samples/sample0014.json"
import sample0015 from "../datasets/jumper-graph-solver/dataset01/samples/sample0015.json"
import sample0016 from "../datasets/jumper-graph-solver/dataset01/samples/sample0016.json"
import sample0017 from "../datasets/jumper-graph-solver/dataset01/samples/sample0017.json"
import sample0018 from "../datasets/jumper-graph-solver/dataset01/samples/sample0018.json"
import sample0019 from "../datasets/jumper-graph-solver/dataset01/samples/sample0019.json"
import sample0020 from "../datasets/jumper-graph-solver/dataset01/samples/sample0020.json"
import sample0021 from "../datasets/jumper-graph-solver/dataset01/samples/sample0021.json"
import sample0022 from "../datasets/jumper-graph-solver/dataset01/samples/sample0022.json"
import sample0023 from "../datasets/jumper-graph-solver/dataset01/samples/sample0023.json"
import sample0024 from "../datasets/jumper-graph-solver/dataset01/samples/sample0024.json"
import sample0025 from "../datasets/jumper-graph-solver/dataset01/samples/sample0025.json"
import sample0026 from "../datasets/jumper-graph-solver/dataset01/samples/sample0026.json"
import sample0027 from "../datasets/jumper-graph-solver/dataset01/samples/sample0027.json"
import sample0028 from "../datasets/jumper-graph-solver/dataset01/samples/sample0028.json"
import sample0029 from "../datasets/jumper-graph-solver/dataset01/samples/sample0029.json"
import sample0030 from "../datasets/jumper-graph-solver/dataset01/samples/sample0030.json"
import sample0031 from "../datasets/jumper-graph-solver/dataset01/samples/sample0031.json"
import sample0032 from "../datasets/jumper-graph-solver/dataset01/samples/sample0032.json"
import sample0033 from "../datasets/jumper-graph-solver/dataset01/samples/sample0033.json"
import sample0034 from "../datasets/jumper-graph-solver/dataset01/samples/sample0034.json"
import sample0035 from "../datasets/jumper-graph-solver/dataset01/samples/sample0035.json"
import sample0036 from "../datasets/jumper-graph-solver/dataset01/samples/sample0036.json"
import sample0037 from "../datasets/jumper-graph-solver/dataset01/samples/sample0037.json"
import sample0038 from "../datasets/jumper-graph-solver/dataset01/samples/sample0038.json"
import sample0039 from "../datasets/jumper-graph-solver/dataset01/samples/sample0039.json"
import sample0040 from "../datasets/jumper-graph-solver/dataset01/samples/sample0040.json"
import sample0041 from "../datasets/jumper-graph-solver/dataset01/samples/sample0041.json"
import sample0042 from "../datasets/jumper-graph-solver/dataset01/samples/sample0042.json"
import sample0043 from "../datasets/jumper-graph-solver/dataset01/samples/sample0043.json"
import sample0044 from "../datasets/jumper-graph-solver/dataset01/samples/sample0044.json"
import sample0045 from "../datasets/jumper-graph-solver/dataset01/samples/sample0045.json"
import sample0046 from "../datasets/jumper-graph-solver/dataset01/samples/sample0046.json"
import sample0047 from "../datasets/jumper-graph-solver/dataset01/samples/sample0047.json"
import sample0048 from "../datasets/jumper-graph-solver/dataset01/samples/sample0048.json"
import sample0049 from "../datasets/jumper-graph-solver/dataset01/samples/sample0049.json"
import sample0050 from "../datasets/jumper-graph-solver/dataset01/samples/sample0050.json"
import sample0051 from "../datasets/jumper-graph-solver/dataset01/samples/sample0051.json"
import sample0052 from "../datasets/jumper-graph-solver/dataset01/samples/sample0052.json"
import sample0053 from "../datasets/jumper-graph-solver/dataset01/samples/sample0053.json"
import sample0054 from "../datasets/jumper-graph-solver/dataset01/samples/sample0054.json"
import sample0055 from "../datasets/jumper-graph-solver/dataset01/samples/sample0055.json"
import sample0056 from "../datasets/jumper-graph-solver/dataset01/samples/sample0056.json"
import sample0057 from "../datasets/jumper-graph-solver/dataset01/samples/sample0057.json"
import sample0058 from "../datasets/jumper-graph-solver/dataset01/samples/sample0058.json"
import sample0059 from "../datasets/jumper-graph-solver/dataset01/samples/sample0059.json"
import sample0060 from "../datasets/jumper-graph-solver/dataset01/samples/sample0060.json"
import sample0061 from "../datasets/jumper-graph-solver/dataset01/samples/sample0061.json"
import sample0062 from "../datasets/jumper-graph-solver/dataset01/samples/sample0062.json"
import sample0063 from "../datasets/jumper-graph-solver/dataset01/samples/sample0063.json"
import sample0064 from "../datasets/jumper-graph-solver/dataset01/samples/sample0064.json"
import sample0065 from "../datasets/jumper-graph-solver/dataset01/samples/sample0065.json"
import sample0066 from "../datasets/jumper-graph-solver/dataset01/samples/sample0066.json"
import sample0067 from "../datasets/jumper-graph-solver/dataset01/samples/sample0067.json"
import sample0068 from "../datasets/jumper-graph-solver/dataset01/samples/sample0068.json"
import sample0069 from "../datasets/jumper-graph-solver/dataset01/samples/sample0069.json"
import sample0070 from "../datasets/jumper-graph-solver/dataset01/samples/sample0070.json"
import sample0071 from "../datasets/jumper-graph-solver/dataset01/samples/sample0071.json"
import sample0072 from "../datasets/jumper-graph-solver/dataset01/samples/sample0072.json"
import sample0073 from "../datasets/jumper-graph-solver/dataset01/samples/sample0073.json"
import sample0074 from "../datasets/jumper-graph-solver/dataset01/samples/sample0074.json"
import sample0075 from "../datasets/jumper-graph-solver/dataset01/samples/sample0075.json"
import sample0076 from "../datasets/jumper-graph-solver/dataset01/samples/sample0076.json"
import sample0077 from "../datasets/jumper-graph-solver/dataset01/samples/sample0077.json"
import sample0078 from "../datasets/jumper-graph-solver/dataset01/samples/sample0078.json"
import sample0079 from "../datasets/jumper-graph-solver/dataset01/samples/sample0079.json"
import sample0080 from "../datasets/jumper-graph-solver/dataset01/samples/sample0080.json"
import sample0081 from "../datasets/jumper-graph-solver/dataset01/samples/sample0081.json"
import sample0082 from "../datasets/jumper-graph-solver/dataset01/samples/sample0082.json"
import sample0083 from "../datasets/jumper-graph-solver/dataset01/samples/sample0083.json"
import sample0084 from "../datasets/jumper-graph-solver/dataset01/samples/sample0084.json"
import sample0085 from "../datasets/jumper-graph-solver/dataset01/samples/sample0085.json"
import sample0086 from "../datasets/jumper-graph-solver/dataset01/samples/sample0086.json"
import sample0087 from "../datasets/jumper-graph-solver/dataset01/samples/sample0087.json"
import sample0088 from "../datasets/jumper-graph-solver/dataset01/samples/sample0088.json"
import sample0089 from "../datasets/jumper-graph-solver/dataset01/samples/sample0089.json"
import sample0090 from "../datasets/jumper-graph-solver/dataset01/samples/sample0090.json"
import sample0091 from "../datasets/jumper-graph-solver/dataset01/samples/sample0091.json"
import sample0092 from "../datasets/jumper-graph-solver/dataset01/samples/sample0092.json"
import sample0093 from "../datasets/jumper-graph-solver/dataset01/samples/sample0093.json"
import sample0094 from "../datasets/jumper-graph-solver/dataset01/samples/sample0094.json"
import sample0095 from "../datasets/jumper-graph-solver/dataset01/samples/sample0095.json"
import sample0096 from "../datasets/jumper-graph-solver/dataset01/samples/sample0096.json"
import sample0097 from "../datasets/jumper-graph-solver/dataset01/samples/sample0097.json"
import sample0098 from "../datasets/jumper-graph-solver/dataset01/samples/sample0098.json"
import sample0099 from "../datasets/jumper-graph-solver/dataset01/samples/sample0099.json"
import sample0100 from "../datasets/jumper-graph-solver/dataset01/samples/sample0100.json"

const dataset = [
  sample0001,
  sample0002,
  sample0003,
  sample0004,
  sample0005,
  sample0006,
  sample0007,
  sample0008,
  sample0009,
  sample0010,
  sample0011,
  sample0012,
  sample0013,
  sample0014,
  sample0015,
  sample0016,
  sample0017,
  sample0018,
  sample0019,
  sample0020,
  sample0021,
  sample0022,
  sample0023,
  sample0024,
  sample0025,
  sample0026,
  sample0027,
  sample0028,
  sample0029,
  sample0030,
  sample0031,
  sample0032,
  sample0033,
  sample0034,
  sample0035,
  sample0036,
  sample0037,
  sample0038,
  sample0039,
  sample0040,
  sample0041,
  sample0042,
  sample0043,
  sample0044,
  sample0045,
  sample0046,
  sample0047,
  sample0048,
  sample0049,
  sample0050,
  sample0051,
  sample0052,
  sample0053,
  sample0054,
  sample0055,
  sample0056,
  sample0057,
  sample0058,
  sample0059,
  sample0060,
  sample0061,
  sample0062,
  sample0063,
  sample0064,
  sample0065,
  sample0066,
  sample0067,
  sample0068,
  sample0069,
  sample0070,
  sample0071,
  sample0072,
  sample0073,
  sample0074,
  sample0075,
  sample0076,
  sample0077,
  sample0078,
  sample0079,
  sample0080,
  sample0081,
  sample0082,
  sample0083,
  sample0084,
  sample0085,
  sample0086,
  sample0087,
  sample0088,
  sample0089,
  sample0090,
  sample0091,
  sample0092,
  sample0093,
  sample0094,
  sample0095,
  sample0096,
  sample0097,
  sample0098,
  sample0099,
  sample0100,
]

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
