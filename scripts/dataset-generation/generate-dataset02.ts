import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATASET01_DIR = path.join(
  __dirname,
  "../../datasets/jumper-graph-solver/dataset01/samples",
)
const OUTPUT_PATH = path.join(
  __dirname,
  "../../datasets/jumper-graph-solver/dataset02.json",
)

interface SerializedPort {
  portId: string
  region1Id: string
  region2Id: string
  d: { x: number; y: number }
}

interface SerializedRegion {
  regionId: string
  pointIds: string[]
  d: {
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
    center: { x: number; y: number }
    isPad: boolean
    isConnectionRegion?: boolean
  }
}

interface SerializedConnection {
  connectionId: string
  startRegionId: string
  endRegionId: string
}

interface Dataset01Sample {
  config: {
    numCrossings: number
    seed: number
    rows: number
    cols: number
    orientation: "vertical" | "horizontal"
  }
  problem: {
    graph: {
      regions: SerializedRegion[]
      ports: SerializedPort[]
    }
    connections: SerializedConnection[]
  }
}

interface Dataset02Sample {
  config: {
    numCrossings: number
    seed: number
    rows: number
    cols: number
    orientation: "vertical" | "horizontal"
  }
  connections: SerializedConnection[]
  connectionRegions: SerializedRegion[]
  connectionPorts: SerializedPort[]
}

function processDataset01Sample(sample: Dataset01Sample): Dataset02Sample {
  const { config, problem } = sample
  const { connections } = problem
  const { regions, ports } = problem.graph

  // Get all connection region IDs
  const connectionRegionIds = new Set<string>()
  for (const conn of connections) {
    connectionRegionIds.add(conn.startRegionId)
    connectionRegionIds.add(conn.endRegionId)
  }

  // Filter regions to only connection regions
  const connectionRegions = regions.filter((region) =>
    connectionRegionIds.has(region.regionId),
  )

  // Filter ports to only those connected to connection regions
  const connectionPorts = ports.filter(
    (port) =>
      connectionRegionIds.has(port.region1Id) ||
      connectionRegionIds.has(port.region2Id),
  )

  return {
    config,
    connections,
    connectionRegions,
    connectionPorts,
  }
}

async function main() {
  console.log("Reading dataset01 samples...")

  // Get all sample files
  const sampleFiles = fs
    .readdirSync(DATASET01_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()

  console.log(`Found ${sampleFiles.length} sample files`)

  const dataset02: Dataset02Sample[] = []

  for (let i = 0; i < sampleFiles.length; i++) {
    const filename = sampleFiles[i]
    const filepath = path.join(DATASET01_DIR, filename)

    if ((i + 1) % 100 === 0) {
      console.log(`Processing ${i + 1}/${sampleFiles.length}...`)
    }

    const content = fs.readFileSync(filepath, "utf-8")
    const sample: Dataset01Sample = JSON.parse(content)

    const processed = processDataset01Sample(sample)
    dataset02.push(processed)
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write dataset02 to JSON file
  console.log("")
  console.log(`Writing dataset02 to: ${OUTPUT_PATH}`)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset02, null, 2))

  // Summary stats
  let totalConnections = 0
  let totalRegions = 0
  let totalPorts = 0

  for (const sample of dataset02) {
    totalConnections += sample.connections.length
    totalRegions += sample.connectionRegions.length
    totalPorts += sample.connectionPorts.length
  }

  console.log("")
  console.log("=== Dataset02 Summary ===")
  console.log(`Total samples: ${dataset02.length}`)
  console.log(`Total connections: ${totalConnections}`)
  console.log(`Total connection regions: ${totalRegions}`)
  console.log(`Total connection ports: ${totalPorts}`)
  console.log(
    `Average connections per sample: ${(totalConnections / dataset02.length).toFixed(1)}`,
  )
  console.log(
    `Average connection regions per sample: ${(totalRegions / dataset02.length).toFixed(1)}`,
  )
  console.log(
    `Average connection ports per sample: ${(totalPorts / dataset02.length).toFixed(1)}`,
  )
  console.log("")
  console.log("Done!")
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
