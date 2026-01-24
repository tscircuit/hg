import { generateJumperGrid } from "../../lib/JumperGraphSolver/jumper-graph-generator/generateJumperGrid"
import {
  createGraphWithConnectionsFromBaseGraph,
  type XYConnection,
} from "../../lib/JumperGraphSolver/jumper-graph-generator/createGraphWithConnectionsFromBaseGraph"
import { JumperGraphSolver } from "../../lib/JumperGraphSolver/JumperGraphSolver"
import * as fs from "fs"
import * as path from "path"

// Types for dataset02 structure
type DatasetSample = {
  config: {
    numCrossings: number
    seed: number
    rows: number
    cols: number
    orientation: "vertical" | "horizontal"
  }
  connections: {
    connectionId: string
    startRegionId: string
    endRegionId: string
  }[]
  connectionRegions: {
    regionId: string
    pointIds: string[]
    d: {
      bounds: { minX: number; maxX: number; minY: number; maxY: number }
      center: { x: number; y: number }
      isPad: boolean
      isConnectionRegion: boolean
    }
  }[]
}

// Grid configurations to try, ordered by jumper count (rows * cols)
const GRID_CONFIGS = [
  { rows: 1, cols: 1 }, // 1 jumper
  { rows: 1, cols: 2 }, // 2 jumpers
  { rows: 2, cols: 1 }, // 2 jumpers
  { rows: 1, cols: 3 }, // 3 jumpers
  { rows: 3, cols: 1 }, // 3 jumpers
  { rows: 2, cols: 2 }, // 4 jumpers
  { rows: 1, cols: 4 }, // 4 jumpers
  { rows: 4, cols: 1 }, // 4 jumpers
  { rows: 2, cols: 3 }, // 6 jumpers
  { rows: 3, cols: 2 }, // 6 jumpers
  { rows: 3, cols: 3 }, // 9 jumpers
  { rows: 2, cols: 4 }, // 8 jumpers
  { rows: 4, cols: 2 }, // 8 jumpers
  { rows: 3, cols: 4 }, // 12 jumpers
  { rows: 4, cols: 3 }, // 12 jumpers
  { rows: 4, cols: 4 }, // 16 jumpers
  { rows: 5, cols: 5 }, // 25 jumpers
  { rows: 6, cols: 6 }, // 36 jumpers
  { rows: 7, cols: 7 }, // 49 jumpers
  { rows: 8, cols: 8 }, // 64 jumpers
].sort((a, b) => a.rows * a.cols - b.rows * b.cols)

const median = (numbers: number[]): number | undefined => {
  if (numbers.length === 0) return undefined
  const sorted = numbers.slice().sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted[middle]
}

const percentile = (numbers: number[], p: number): number | undefined => {
  if (numbers.length === 0) return undefined
  const sorted = numbers.slice().sort((a, b) => a - b)
  const index = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[index]
}

const createBaseGraph = (
  rows: number,
  cols: number,
  orientation: "vertical" | "horizontal" = "vertical",
) =>
  generateJumperGrid({
    cols,
    rows,
    marginX: 0.8,
    marginY: 0.8,
    outerPaddingX: 1.5,
    outerPaddingY: 1.5,
    innerColChannelPointCount: 2,
    innerRowChannelPointCount: 2,
    outerChannelXPoints: 4,
    outerChannelYPoints: 4,
    orientation,
  })

/**
 * Extracts XYConnections from a dataset sample by mapping connection IDs
 * to their corresponding region centers
 */
const extractXYConnections = (sample: DatasetSample): XYConnection[] => {
  const regionMap = new Map(
    sample.connectionRegions.map((r) => [r.regionId, r.d.center]),
  )

  return sample.connections.map((conn) => {
    const start = regionMap.get(conn.startRegionId)
    const end = regionMap.get(conn.endRegionId)

    if (!start || !end) {
      throw new Error(
        `Missing region for connection ${conn.connectionId}: start=${conn.startRegionId}, end=${conn.endRegionId}`,
      )
    }

    return {
      connectionId: conn.connectionId,
      start,
      end,
    }
  })
}

/**
 * Attempts to solve a problem with a given grid configuration and orientation
 */
const tryToSolve = (
  xyConnections: XYConnection[],
  rows: number,
  cols: number,
  orientation: "vertical" | "horizontal",
): { solved: boolean; iterations: number; duration: number } => {
  try {
    const baseGraph = createBaseGraph(rows, cols, orientation)
    const graphWithConnections = createGraphWithConnectionsFromBaseGraph(
      baseGraph,
      xyConnections,
    )

    const solver = new JumperGraphSolver({
      inputGraph: {
        regions: graphWithConnections.regions,
        ports: graphWithConnections.ports,
      },
      inputConnections: graphWithConnections.connections,
    })

    const startTime = performance.now()
    solver.solve()
    const duration = performance.now() - startTime

    return { solved: solver.solved, iterations: solver.iterations, duration }
  } catch {
    return { solved: false, iterations: 0, duration: 0 }
  }
}

// Load dataset02
const datasetPath = path.join(
  __dirname,
  "../../datasets/jumper-graph-solver/dataset02.json",
)
const dataset: DatasetSample[] = JSON.parse(
  fs.readFileSync(datasetPath, "utf8"),
)

console.log("Benchmark: 0603 Jumper Grid Solver")
console.log("=".repeat(70))
console.log(`Loaded ${dataset.length} samples from dataset02`)
console.log(
  `Testing grid sizes: ${GRID_CONFIGS.map((g) => `${g.rows}x${g.cols}`).join(", ")}`,
)
console.log(
  `Each configuration tested in both vertical and horizontal orientations\n`,
)

const results: {
  sampleIndex: number
  numCrossings: number
  solved: boolean
  jumpersUsed: number | null
  gridUsed: string | null
  orientationUsed: string | null
  iterations: number | null
  duration: number | null
}[] = []

// Progress tracking
let lastProgressTime = Date.now()
let currentSampleIndex = 0
let currentGridConfig = ""
let currentOrientation = ""
let attemptsThisSample = 0

const printProgress = () => {
  const solvedSoFar = results.filter((r) => r.solved).length
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(
    `[${elapsed}s] Sample ${currentSampleIndex + 1}/${dataset.length} | ` +
      `Testing ${currentGridConfig} ${currentOrientation} | ` +
      `Attempt ${attemptsThisSample} | ` +
      `Solved: ${solvedSoFar}/${results.length}`,
  )
}

const startTime = Date.now()

for (let i = 0; i < dataset.length; i++) {
  currentSampleIndex = i
  attemptsThisSample = 0
  const sample = dataset[i]
  const xyConnections = extractXYConnections(sample)

  let solved = false
  let jumpersUsed: number | null = null
  let gridUsed: string | null = null
  let orientationUsed: string | null = null
  let iterations: number | null = null
  let duration: number | null = null

  // Try each grid configuration in order of jumper count
  for (const { rows, cols } of GRID_CONFIGS) {
    if (solved) break

    // Try both orientations
    for (const orientation of ["vertical", "horizontal"] as const) {
      currentGridConfig = `${rows}x${cols}`
      currentOrientation = orientation
      attemptsThisSample++

      // Print progress every 1 second
      const now = Date.now()
      if (now - lastProgressTime >= 1000) {
        printProgress()
        lastProgressTime = now
      }

      const result = tryToSolve(xyConnections, rows, cols, orientation)

      if (result.solved) {
        solved = true
        jumpersUsed = rows * cols
        gridUsed = `${rows}x${cols}`
        orientationUsed = orientation
        iterations = result.iterations
        duration = result.duration
        break
      }
    }
  }

  results.push({
    sampleIndex: i,
    numCrossings: sample.config.numCrossings,
    solved,
    jumpersUsed,
    gridUsed,
    orientationUsed,
    iterations,
    duration,
  })
}

// Final progress
const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
console.log(`\nCompleted in ${totalElapsed}s\n`)

// Calculate statistics
const solvedResults = results.filter((r) => r.solved)
const unsolvedResults = results.filter((r) => !r.solved)

const completionRate = (solvedResults.length / results.length) * 100
const jumperCounts = solvedResults.map((r) => r.jumpersUsed!)
const medianJumpers = median(jumperCounts)
const p25Jumpers = percentile(jumperCounts, 25)
const p75Jumpers = percentile(jumperCounts, 75)
const p95Jumpers = percentile(jumperCounts, 95)

console.log("=".repeat(70))
console.log("Results Summary")
console.log("=".repeat(70))
console.log(
  `Completion: ${solvedResults.length}/${results.length} (${completionRate.toFixed(1)}%)`,
)
console.log(`Median jumpers used: ${medianJumpers ?? "N/A"}`)
console.log(
  `Jumper distribution: P25=${p25Jumpers ?? "N/A"}, P75=${p75Jumpers ?? "N/A"}, P95=${p95Jumpers ?? "N/A"}`,
)

// Distribution by grid size used
console.log("\nSolutions by grid size:")
const gridCounts = new Map<string, number>()
for (const r of solvedResults) {
  const grid = r.gridUsed!
  gridCounts.set(grid, (gridCounts.get(grid) || 0) + 1)
}
const sortedGrids = Array.from(gridCounts.entries()).sort((a, b) => {
  const [aRows, aCols] = a[0].split("x").map(Number)
  const [bRows, bCols] = b[0].split("x").map(Number)
  return aRows * aCols - bRows * bCols
})
for (const [grid, count] of sortedGrids) {
  const [rows, cols] = grid.split("x").map(Number)
  const jumpers = rows * cols
  const pct = ((count / solvedResults.length) * 100).toFixed(1)
  console.log(`  ${grid} (${jumpers} jumpers): ${count} solutions (${pct}%)`)
}

// Distribution by crossing count
console.log("\nCompletion by crossing count:")
const crossingGroups = new Map<number, { solved: number; total: number }>()
for (const r of results) {
  const crossings = r.numCrossings
  if (!crossingGroups.has(crossings)) {
    crossingGroups.set(crossings, { solved: 0, total: 0 })
  }
  const group = crossingGroups.get(crossings)!
  group.total++
  if (r.solved) group.solved++
}
const sortedCrossings = Array.from(crossingGroups.entries()).sort(
  (a, b) => a[0] - b[0],
)
for (const [crossings, { solved, total }] of sortedCrossings) {
  const pct = ((solved / total) * 100).toFixed(0)
  const solvedJumpers = results
    .filter((r) => r.numCrossings === crossings && r.solved)
    .map((r) => r.jumpersUsed!)
  const medJumpers = median(solvedJumpers)
  console.log(
    `  ${crossings} crossings: ${solved}/${total} (${pct}%) solved, median ${medJumpers ?? "N/A"} jumpers`,
  )
}

if (unsolvedResults.length > 0 && unsolvedResults.length <= 20) {
  console.log("\nUnsolved samples:")
  for (const r of unsolvedResults) {
    const sample = dataset[r.sampleIndex]
    console.log(
      `  - Sample ${r.sampleIndex}: ${sample.config.numCrossings} crossings, seed=${sample.config.seed}`,
    )
  }
} else if (unsolvedResults.length > 20) {
  console.log(
    `\n${unsolvedResults.length} samples could not be solved with any configuration`,
  )
}

console.log("\n" + "=".repeat(70))
console.log("Benchmark complete")
console.log("=".repeat(70))
