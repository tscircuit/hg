import { generateJumperX4Grid } from "../../lib/JumperGraphSolver/jumper-graph-generator/generateJumperX4Grid"
import { createProblemFromBaseGraph } from "../../lib/JumperGraphSolver/jumper-graph-generator/createProblemFromBaseGraph"
import type { JumperGraphWithConnections } from "../../lib/JumperGraphSolver/jumper-graph-generator/createGraphWithConnectionsFromBaseGraph"
import {
  JumperGraphSolver,
  JUMPER_GRAPH_SOLVER_DEFAULTS,
} from "../../lib/JumperGraphSolver/JumperGraphSolver"
import { countInputConnectionCrossings } from "../../lib/JumperGraphSolver/countInputConnectionCrossings"
import { convertHyperGraphToSerializedHyperGraph } from "../../lib/convertHyperGraphToSerializedHyperGraph"
import { convertConnectionsToSerializedConnections } from "../../lib/convertConnectionsToSerializedConnections"
import * as fs from "node:fs"
import * as path from "node:path"

// Parse --samples argument
const args = process.argv.slice(2)
let targetSamples = 1000
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--samples" && args[i + 1]) {
    targetSamples = parseInt(args[i + 1], 10)
    if (isNaN(targetSamples) || targetSamples <= 0) {
      console.error("Invalid --samples value. Must be a positive integer.")
      process.exit(1)
    }
  }
}

// Configuration
const MIN_CROSSINGS = 5
const MAX_CROSSINGS = 30
const MIN_GRID_SIZE = 1
const MAX_GRID_SIZE = 4
const OUTPUT_PATH = path.join(
  __dirname,
  "../../datasets/jumper-graph-solver/dataset01.json",
)

// Iteration multipliers for filtering
const PASS_MULTIPLIER = 20
const FAIL_MULTIPLIER = 0.25

// Seed tracking
const usedSeeds = new Set<number>()
let seedCounter = 0

function getUniqueSeed(): number {
  while (usedSeeds.has(seedCounter)) {
    seedCounter++
  }
  usedSeeds.add(seedCounter)
  return seedCounter++
}

// Seeded random for orientation selection
function createSeededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

interface ProblemConfig {
  numCrossings: number
  seed: number
  rows: number
  cols: number
  orientation: "vertical" | "horizontal"
}

interface DatasetEntry {
  config: ProblemConfig
  problem: {
    graph: ReturnType<typeof convertHyperGraphToSerializedHyperGraph>
    connections: ReturnType<typeof convertConnectionsToSerializedConnections>
  }
}

function createBaseGraph(
  orientation: "vertical" | "horizontal",
  rows: number,
  cols: number,
) {
  return generateJumperX4Grid({
    cols,
    rows,
    marginX: 1.2,
    marginY: 1.2,
    outerPaddingX: 2,
    outerPaddingY: 2,
    innerColChannelPointCount: 3,
    innerRowChannelPointCount: 3,
    outerChannelXPointCount: 3,
    outerChannelYPointCount: 3,
    regionsBetweenPads: true,
    orientation,
  })
}

function generateProblem(config: ProblemConfig): JumperGraphWithConnections {
  const baseGraph = createBaseGraph(
    config.orientation,
    config.rows,
    config.cols,
  )
  return createProblemFromBaseGraph({
    baseGraph,
    numCrossings: config.numCrossings,
    randomSeed: config.seed,
  })
}

function testProblemWithMultiplier(
  problem: JumperGraphWithConnections,
  iterationMultiplier: number,
): boolean {
  // Clone to avoid mutation
  const clonedProblem = structuredClone(problem)

  // Calculate base max iterations the solver would use
  const crossings = countInputConnectionCrossings(
    { regions: clonedProblem.regions, ports: clonedProblem.ports },
    clonedProblem.connections,
  )
  const baseIterations =
    4000 + // baseMaxIterations
    clonedProblem.connections.length * 2000 + // additionalMaxIterationsPerConnection
    crossings * 2000 // additionalMaxIterationsPerCrossing

  const adjustedIterations = Math.floor(baseIterations * iterationMultiplier)

  // Create solver with adjusted iteration limit
  const solver = new JumperGraphSolver({
    inputGraph: clonedProblem,
    inputConnections: clonedProblem.connections,
    ...JUMPER_GRAPH_SOLVER_DEFAULTS,
    baseMaxIterations: adjustedIterations,
    additionalMaxIterationsPerConnection: 0, // Already accounted for
  })

  // Override MAX_ITERATIONS directly since we calculated it ourselves
  ;(solver as any).MAX_ITERATIONS = adjustedIterations

  solver.solve()
  return solver.solved
}

function generateRandomConfig(random: () => number): ProblemConfig {
  const numCrossings =
    MIN_CROSSINGS + Math.floor(random() * (MAX_CROSSINGS - MIN_CROSSINGS + 1))
  const rows =
    MIN_GRID_SIZE + Math.floor(random() * (MAX_GRID_SIZE - MIN_GRID_SIZE + 1))
  const cols =
    MIN_GRID_SIZE + Math.floor(random() * (MAX_GRID_SIZE - MIN_GRID_SIZE + 1))
  const orientation = random() < 0.5 ? "vertical" : "horizontal"

  return {
    numCrossings,
    seed: getUniqueSeed(),
    rows,
    cols,
    orientation,
  }
}

async function main() {
  console.log(`Generating dataset with ${targetSamples} non-trivial problems`)
  console.log(`Crossings range: ${MIN_CROSSINGS}-${MAX_CROSSINGS}`)
  console.log(
    `Grid sizes: ${MIN_GRID_SIZE}x${MIN_GRID_SIZE} to ${MAX_GRID_SIZE}x${MAX_GRID_SIZE}`,
  )
  console.log(`Pass condition: solve with ${PASS_MULTIPLIER}x iterations`)
  console.log(`Fail condition: not solve with ${FAIL_MULTIPLIER}x iterations`)
  console.log("")

  const dataset: DatasetEntry[] = []
  let attempted = 0
  let generated = 0
  let passedHighIter = 0
  let failedLowIter = 0
  let problemGenerationFailed = 0

  const configRandom = createSeededRandom(42) // Fixed seed for reproducibility

  const startTime = Date.now()

  while (dataset.length < targetSamples) {
    attempted++
    const config = generateRandomConfig(configRandom)

    // Log attempt
    process.stdout.write(
      `\r[${dataset.length}/${targetSamples}] Attempting config #${attempted}: ` +
        `${config.rows}x${config.cols} ${config.orientation}, ` +
        `${config.numCrossings} crossings, seed=${config.seed}...`,
    )

    let problem: JumperGraphWithConnections
    try {
      problem = generateProblem(config)
      generated++
    } catch (e) {
      problemGenerationFailed++
      process.stdout.write(" FAILED (problem generation)\n")
      continue
    }

    // Test with high iterations (should PASS)
    const passesHighIter = testProblemWithMultiplier(problem, PASS_MULTIPLIER)
    if (!passesHighIter) {
      process.stdout.write(` SKIPPED (doesn't pass at ${PASS_MULTIPLIER}x)\n`)
      continue
    }
    passedHighIter++

    // Test with low iterations (should FAIL)
    const passesLowIter = testProblemWithMultiplier(problem, FAIL_MULTIPLIER)
    if (passesLowIter) {
      process.stdout.write(
        ` SKIPPED (passes at ${FAIL_MULTIPLIER}x - too easy)\n`,
      )
      continue
    }
    failedLowIter++

    // This problem is non-trivial - add to dataset
    const entry: DatasetEntry = {
      config,
      problem: {
        graph: convertHyperGraphToSerializedHyperGraph(problem),
        connections: convertConnectionsToSerializedConnections(
          problem.connections,
        ),
      },
    }
    dataset.push(entry)

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1)
    const rate = (dataset.length / ((Date.now() - startTime) / 1000)).toFixed(2)
    process.stdout.write(
      ` ACCEPTED (${dataset.length}/${targetSamples}, ${rate}/s, ${elapsedSec}s elapsed)\n`,
    )

    // Log progress summary every 50 problems
    if (dataset.length % 50 === 0) {
      console.log("")
      console.log(`--- Progress Summary ---`)
      console.log(`  Problems collected: ${dataset.length}/${targetSamples}`)
      console.log(`  Total attempts: ${attempted}`)
      console.log(`  Problems generated successfully: ${generated}`)
      console.log(`  Failed problem generation: ${problemGenerationFailed}`)
      console.log(
        `  Acceptance rate: ${((dataset.length / attempted) * 100).toFixed(1)}%`,
      )
      console.log(`  Time elapsed: ${elapsedSec}s`)
      console.log("")
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log("")
  console.log("=== Generation Complete ===")
  console.log(`Total problems collected: ${dataset.length}`)
  console.log(`Total attempts: ${attempted}`)
  console.log(`Problems generated successfully: ${generated}`)
  console.log(`Failed problem generation: ${problemGenerationFailed}`)
  console.log(`Passed high iteration test: ${passedHighIter}`)
  console.log(`Failed low iteration test (as expected): ${failedLowIter}`)
  console.log(
    `Overall acceptance rate: ${((dataset.length / attempted) * 100).toFixed(1)}%`,
  )
  console.log(`Total time: ${totalTime}s`)

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write dataset to JSON file
  console.log("")
  console.log(`Writing dataset to: ${OUTPUT_PATH}`)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2))
  console.log(`Done! Dataset saved with ${dataset.length} problems.`)

  // Log distribution summary
  console.log("")
  console.log("=== Dataset Distribution ===")

  const crossingDist: Record<number, number> = {}
  const gridDist: Record<string, number> = {}
  const orientationDist: Record<string, number> = { vertical: 0, horizontal: 0 }

  for (const entry of dataset) {
    const { numCrossings, rows, cols, orientation } = entry.config
    crossingDist[numCrossings] = (crossingDist[numCrossings] || 0) + 1
    const gridKey = `${rows}x${cols}`
    gridDist[gridKey] = (gridDist[gridKey] || 0) + 1
    orientationDist[orientation]++
  }

  console.log("Crossings distribution:")
  const crossingKeys = Object.keys(crossingDist)
    .map(Number)
    .sort((a, b) => a - b)
  for (const c of crossingKeys) {
    console.log(`  ${c}: ${crossingDist[c]}`)
  }

  console.log("")
  console.log("Grid size distribution:")
  const gridKeys = Object.keys(gridDist).sort()
  for (const g of gridKeys) {
    console.log(`  ${g}: ${gridDist[g]}`)
  }

  console.log("")
  console.log("Orientation distribution:")
  console.log(`  vertical: ${orientationDist.vertical}`)
  console.log(`  horizontal: ${orientationDist.horizontal}`)
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
