/**
 * Hyperparameter optimization using Simultaneous Perturbation Stochastic Approximation (SPSA)
 *
 * SPSA is an efficient gradient-free optimization method that only requires 2 function
 * evaluations per iteration, regardless of the number of parameters. This is much more
 * efficient than finite-difference methods which require 2p evaluations (where p = number
 * of parameters).
 *
 * Key features:
 * - Uses random perturbation vectors (Bernoulli ±1) to estimate gradients
 * - Gain sequences a_k and c_k that decay over iterations for convergence
 * - Pre-generates all problems and uses structuredClone for solver isolation
 *
 * Reference: Spall, J. C. (1992). "Multivariate Stochastic Approximation Using a
 * Simultaneous Perturbation Gradient Approximation"
 */

import {
  JumperGraphSolver,
  JUMPER_GRAPH_SOLVER_DEFAULTS,
} from "../../lib/JumperGraphSolver/JumperGraphSolver"
import {
  type Parameters,
  type SampleConfig,
  PARAM_KEYS,
  formatParams,
  formatTime,
  createZeroParams,
} from "./types"
import {
  createBaseGraph,
  getUniqueSeed,
  getUsedSeedsCount,
  type PregeneratedProblem,
} from "./problem-generator"
import { createProblemFromBaseGraph } from "../../lib/JumperGraphSolver/jumper-graph-generator/createProblemFromBaseGraph"
import { evaluateParametersOnProblems } from "./evaluator"

// Dataset sizes
const TRAIN_SAMPLES = 100
const VAL_SAMPLES = 100
const BATCH_SIZE = 100 // Number of training samples to use per iteration
const EPOCHS_PER_VALIDATION = 5

// SPSA hyperparameters
const NUM_ITERATIONS = 200

// Standard SPSA gain sequence parameters
// a_k = a / (k + A)^alpha - step size
// c_k = c / k^gamma - perturbation size
const SPSA_a = 2 // Initial step size multiplier
const SPSA_c = 0.5 // Initial perturbation size
const SPSA_A = 20 // Stability constant (typically ~10% of max iterations)
const SPSA_alpha = 0.602 // Standard value for asymptotic convergence
const SPSA_gamma = 0.101 // Standard value for asymptotic convergence

const MIN_CROSSINGS = 5
const MAX_CROSSINGS = 40

// Parse command line flags
const FAILING_ONLY = process.argv.includes("--failing-only")

// Parameter scaling factors to handle different parameter magnitudes
// SPSA works best when all parameters are roughly the same scale (~O(1))
// Using default values as scales means x starts near 1 everywhere
const PARAM_SCALES: Parameters = {
  portUsagePenalty: Math.max(
    0.1,
    JUMPER_GRAPH_SOLVER_DEFAULTS.portUsagePenalty,
  ),
  crossingPenalty: Math.max(0.1, JUMPER_GRAPH_SOLVER_DEFAULTS.crossingPenalty),
  ripCost: Math.max(0.1, JUMPER_GRAPH_SOLVER_DEFAULTS.ripCost),
  greedyMultiplier: Math.max(
    0.1,
    JUMPER_GRAPH_SOLVER_DEFAULTS.greedyMultiplier,
  ),
}

/**
 * Convert real parameters θ to scaled internal space x where x_i = θ_i / scale_i
 * This makes all coordinates ~O(1) for stable SPSA optimization
 */
function toScaled(params: Parameters): Parameters {
  const x = createZeroParams()
  for (const key of PARAM_KEYS) {
    x[key] = params[key] / PARAM_SCALES[key]
  }
  return x
}

/**
 * Convert scaled internal space x back to real parameters θ where θ_i = scale_i * x_i
 * Clamps to positive values to maintain valid parameters
 */
function fromScaled(x: Parameters): Parameters {
  const params = createZeroParams()
  for (const key of PARAM_KEYS) {
    params[key] = Math.max(0.001, x[key] * PARAM_SCALES[key])
  }
  return params
}

/**
 * Sample a random batch of configs from the full training set
 */
function sampleBatch(
  configs: SampleConfig[],
  batchSize: number,
): SampleConfig[] {
  if (batchSize >= configs.length) {
    return configs
  }
  const shuffled = [...configs]
  // Fisher-Yates shuffle (partial - only need first batchSize elements)
  for (let i = 0; i < batchSize; i++) {
    const j = i + Math.floor(Math.random() * (shuffled.length - i))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, batchSize)
}

/**
 * Generate a random Bernoulli perturbation vector (each element is ±1 with equal probability)
 */
function generatePerturbation(): Parameters {
  const delta = createZeroParams()
  for (const key of PARAM_KEYS) {
    delta[key] = Math.random() < 0.5 ? -1 : 1
  }
  return delta
}

/**
 * Compute gain sequences for iteration k (1-indexed)
 */
function getGains(k: number): { a_k: number; c_k: number } {
  const a_k = SPSA_a / Math.pow(k + SPSA_A, SPSA_alpha)
  const c_k = SPSA_c / Math.pow(k, SPSA_gamma)
  return { a_k, c_k }
}

/**
 * Perturb in x-space (scaled internal space): x ± c_k * delta
 * No parameter scales here - scaling is handled by the space transformation
 */
function perturbScaled(
  x: Parameters,
  delta: Parameters,
  c_k: number,
  sign: 1 | -1,
): Parameters {
  const perturbed = { ...x }
  for (const key of PARAM_KEYS) {
    perturbed[key] = x[key] + sign * c_k * delta[key]
  }
  return perturbed
}

/**
 * Estimate gradient in x-space using SPSA: g_x,i = (y+ - y-) / (2 * c_k * delta_i)
 * No parameter scales here - gradient is in the scaled internal space
 */
function estimateGradientScaled(
  yPlus: number,
  yMinus: number,
  delta: Parameters,
  c_k: number,
): Parameters {
  const gradient = createZeroParams()
  const diff = yPlus - yMinus

  for (const key of PARAM_KEYS) {
    gradient[key] = diff / (2 * c_k * delta[key])
  }

  return gradient
}

/**
 * Update in x-space: x = x + a_k * gradient
 * No parameter scales here - update is in the scaled internal space
 */
function updateScaled(
  x: Parameters,
  gradient: Parameters,
  a_k: number,
): Parameters {
  const newX = { ...x }
  for (const key of PARAM_KEYS) {
    newX[key] = x[key] + a_k * gradient[key]
  }
  return newX
}

function formatGradient(gradient: Parameters): string {
  return [
    `d_port=${gradient.portUsagePenalty.toFixed(4)}`,
    `d_cross=${gradient.crossingPenalty.toFixed(4)}`,
    `d_rip=${gradient.ripCost.toFixed(6)}`,
    `d_greedy=${gradient.greedyMultiplier.toFixed(4)}`,
  ].join(", ")
}

/**
 * Checks if a set of pregenerated problems (for a single config) can be solved
 * with default parameters. Returns true if ANY orientation solves.
 */
function solvesProblemWithDefaults(problems: PregeneratedProblem[]): boolean {
  for (const { problem } of problems) {
    const clonedProblem = structuredClone(problem)
    const solver = new JumperGraphSolver({
      inputGraph: {
        regions: clonedProblem.regions,
        ports: clonedProblem.ports,
      },
      inputConnections: clonedProblem.connections,
      portUsagePenalty: JUMPER_GRAPH_SOLVER_DEFAULTS.portUsagePenalty,
      crossingPenalty: JUMPER_GRAPH_SOLVER_DEFAULTS.crossingPenalty,
      ripCost: JUMPER_GRAPH_SOLVER_DEFAULTS.ripCost,
    })
    ;(solver as any).greedyMultiplier =
      JUMPER_GRAPH_SOLVER_DEFAULTS.greedyMultiplier
    solver.solve()
    if (solver.solved) {
      return true
    }
  }
  return false
}

/**
 * Generates sample configs and pregenerated problems, optionally filtering to only
 * samples that fail with default parameters. Always returns exactly `count` samples.
 */
function generateSamplesWithProblems(
  count: number,
  minCrossings: number,
  maxCrossings: number,
  failingOnly: boolean,
  progressLabel?: string,
): {
  configs: SampleConfig[]
  problemsByConfig: Map<number, PregeneratedProblem[]>
} {
  const configs: SampleConfig[] = []
  const problemsByConfig = new Map<number, PregeneratedProblem[]>()

  const allGridSizes: [1 | 2 | 3, 1 | 2 | 3][] = [
    [1, 1],
    [1, 2],
    [2, 1],
    [2, 2],
    [1, 3],
    [2, 3],
    [3, 1],
    [3, 2],
    [3, 3],
  ]
  const largeGridSizes: [1 | 2 | 3, 1 | 2 | 3][] = [
    [1, 2],
    [2, 1],
    [2, 2],
    [1, 3],
    [2, 3],
    [3, 1],
    [3, 2],
    [3, 3],
  ]

  let generated = 0
  let crossingIndex = 0

  while (configs.length < count) {
    const numCrossings =
      minCrossings + (crossingIndex % (maxCrossings - minCrossings + 1))
    const gridSizes = numCrossings > 8 ? largeGridSizes : allGridSizes
    const [rows, cols] = gridSizes[crossingIndex % gridSizes.length]
    const seed = getUniqueSeed()
    const config: SampleConfig = { numCrossings, seed, rows, cols }

    crossingIndex++
    generated++

    if (progressLabel) {
      const status = failingOnly
        ? `${progressLabel}: generated ${generated}, kept ${configs.length}/${count} failing`
        : `${progressLabel}: ${configs.length + 1}/${count}`
      process.stdout.write(`\r${status}`)
    }

    // Generate problems for both orientations
    const problems: PregeneratedProblem[] = []
    for (const orientation of ["vertical", "horizontal"] as const) {
      const problem = createProblemFromBaseGraph({
        baseGraph: createBaseGraph(orientation, config.rows, config.cols),
        numCrossings: config.numCrossings,
        randomSeed: config.seed,
      })
      problems.push({ config, orientation, problem })
    }

    // If failingOnly mode, check if it solves with defaults
    if (failingOnly && solvesProblemWithDefaults(problems)) {
      continue // Skip this sample, it solves with defaults
    }

    configs.push(config)
    problemsByConfig.set(config.seed, problems)
  }

  if (progressLabel) {
    process.stdout.write("\r" + " ".repeat(80) + "\r")
  }

  return { configs, problemsByConfig }
}

async function main() {
  console.log("JumperGraphSolver Parameter Optimization via SPSA")
  console.log("=".repeat(70))
  console.log(`Training samples: ${TRAIN_SAMPLES}`)
  console.log(`Validation samples: ${VAL_SAMPLES}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`Number of iterations: ${NUM_ITERATIONS}`)
  if (FAILING_ONLY) {
    console.log(`Mode: --failing-only (only samples that fail with defaults)`)
  }
  console.log()
  console.log("SPSA hyperparameters:")
  console.log(`  a = ${SPSA_a}, c = ${SPSA_c}, A = ${SPSA_A}`)
  console.log(`  alpha = ${SPSA_alpha}, gamma = ${SPSA_gamma}`)
  console.log()
  console.log(
    "Using: SPSA gradient estimation, mini-batch sampling, pregenerated problems, structuredClone",
  )
  console.log("=".repeat(70))
  console.log()

  // === GENERATE SAMPLES AND PROBLEMS ===
  console.log(
    FAILING_ONLY
      ? "Generating samples (only keeping those that fail with defaults)..."
      : "Generating samples and problems...",
  )
  const { configs: trainConfigs, problemsByConfig: trainProblemsByConfig } =
    generateSamplesWithProblems(
      TRAIN_SAMPLES,
      MIN_CROSSINGS,
      MAX_CROSSINGS,
      FAILING_ONLY,
      "  Train",
    )
  const { configs: valConfigs, problemsByConfig: valProblemsByConfig } =
    generateSamplesWithProblems(
      VAL_SAMPLES,
      MIN_CROSSINGS,
      MAX_CROSSINGS,
      FAILING_ONLY,
      "  Val",
    )
  console.log(`  Train: ${trainConfigs.length} samples`)
  console.log(`  Val: ${valConfigs.length} samples`)
  console.log()

  // Initial parameters (in real/θ space)
  let params: Parameters = { ...JUMPER_GRAPH_SOLVER_DEFAULTS }
  // Convert to scaled/internal space (x) for SPSA optimization
  let x: Parameters = toScaled(params)

  console.log("Initial parameters:")
  console.log(formatParams(params))
  console.log()

  // Evaluate initial performance
  console.log("Evaluating initial parameters...")
  const initialTrainResult = evaluateParametersOnProblems(
    params,
    trainProblemsByConfig,
    trainConfigs,
    "Train",
  )
  const initialValResult = evaluateParametersOnProblems(
    params,
    valProblemsByConfig,
    valConfigs,
    "Val",
  )
  console.log(
    `  Train: ${(initialTrainResult.successRate * 100).toFixed(2)}% solved`,
  )
  console.log(
    `  Val:   ${(initialValResult.successRate * 100).toFixed(2)}% solved`,
  )
  console.log()

  let bestParams = { ...params }
  let bestValScore = initialValResult.successRate

  const optimizationStartTime = performance.now()

  for (let k = 1; k <= NUM_ITERATIONS; k++) {
    const iterStartTime = performance.now()

    // Get gain sequences for this iteration
    const { a_k, c_k } = getGains(k)

    // Sample a random batch for this iteration
    const batchConfigs = sampleBatch(trainConfigs, BATCH_SIZE)

    // Generate random perturbation vector (Bernoulli ±1)
    const delta = generatePerturbation()

    // Perturb in x-space (scaled internal space)
    const xPlus = perturbScaled(x, delta, c_k, 1)
    const xMinus = perturbScaled(x, delta, c_k, -1)

    // Convert back to real parameters for evaluation
    const paramsPlus = fromScaled(xPlus)
    const paramsMinus = fromScaled(xMinus)

    // Evaluate at perturbed points
    const resultPlus = evaluateParametersOnProblems(
      paramsPlus,
      trainProblemsByConfig,
      batchConfigs,
      `Iter ${k} +`,
    )
    const resultMinus = evaluateParametersOnProblems(
      paramsMinus,
      trainProblemsByConfig,
      batchConfigs,
      `Iter ${k} -`,
    )

    // Estimate gradient in x-space using SPSA formula
    const gradient = estimateGradientScaled(
      resultPlus.successRate,
      resultMinus.successRate,
      delta,
      c_k,
    )

    // Update in x-space
    x = updateScaled(x, gradient, a_k)
    // Convert back to real parameters for printing/validation
    params = fromScaled(x)

    // Evaluate on validation set periodically to save time
    let valResult = { successRate: 0 }
    if (k % EPOCHS_PER_VALIDATION === 0 || k === NUM_ITERATIONS) {
      valResult = evaluateParametersOnProblems(
        params,
        valProblemsByConfig,
        valConfigs,
        `Iter ${k} Val`,
      )

      // Track best based on validation score
      if (valResult.successRate > bestValScore) {
        bestValScore = valResult.successRate
        bestParams = { ...params }
        console.log(`  *** New best! ***`)
      }
    }

    const iterDuration = (performance.now() - iterStartTime) / 1000
    const totalElapsedSec = (performance.now() - optimizationStartTime) / 1000
    const avgSecondsPerIter = totalElapsedSec / k
    const etaSeconds = avgSecondsPerIter * (NUM_ITERATIONS - k)

    // Use the better of the two perturbed success rates as a proxy for current performance
    const trainSuccessRate = Math.max(
      resultPlus.successRate,
      resultMinus.successRate,
    )

    console.log(
      `Iter ${k.toString().padStart(3)}/${NUM_ITERATIONS} | ` +
        `Train: ${(trainSuccessRate * 100).toFixed(2)}% | ` +
        (valResult.successRate > 0
          ? `Val: ${(valResult.successRate * 100).toFixed(2)}% | `
          : "") +
        `a_k=${a_k.toFixed(4)}, c_k=${c_k.toFixed(4)} | ` +
        `Time: ${iterDuration.toFixed(1)}s`,
    )
    console.log(
      `  Total: ${formatTime(totalElapsedSec)} | ETA: ${formatTime(etaSeconds)}`,
    )
    console.log(`  Gradient: ${formatGradient(gradient)}`)
    console.log(`  Params:   ${formatParams(params)}`)
    console.log()
  }

  console.log("=".repeat(70))
  console.log("Optimization Complete!")
  console.log("=".repeat(70))
  console.log()

  // Final evaluation
  const finalValResult = evaluateParametersOnProblems(
    params,
    valProblemsByConfig,
    valConfigs,
    "Final Val",
  )
  const bestValResult = evaluateParametersOnProblems(
    bestParams,
    valProblemsByConfig,
    valConfigs,
    "Best Val",
  )

  console.log("Final parameters (last iteration):")
  console.log(formatParams(params))
  console.log(`  Val: ${(finalValResult.successRate * 100).toFixed(2)}% solved`)
  console.log()

  console.log("Best parameters (by validation score):")
  console.log(formatParams(bestParams))
  console.log(`  Val: ${(bestValResult.successRate * 100).toFixed(2)}% solved`)
  console.log()

  console.log(`Total unique seeds used: ${getUsedSeedsCount()}`)

  // Output as JSON for easy copy-paste
  console.log()
  console.log("Best parameters as JSON:")
  console.log(JSON.stringify(bestParams, null, 2))
}

main().catch(console.error)
