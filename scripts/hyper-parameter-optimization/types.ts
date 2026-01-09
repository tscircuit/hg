export interface Parameters {
  portUsagePenalty: number
  portUsagePenaltySq: number
  crossingPenalty: number
  crossingPenaltySq: number
  ripCost: number
  greedyMultiplier: number
  // New tunable parameters
  hopDistanceMultiplier: number
  ripCountExponent: number
  crossingExponent: number
  sameNetCrossingPenalty: number
  congestionRadius: number
  congestionPenaltyMultiplier: number
  connectionOrderWeight: number
}

export const PARAM_KEYS: (keyof Parameters)[] = [
  "portUsagePenalty",
  "portUsagePenaltySq",
  "crossingPenalty",
  "crossingPenaltySq",
  "ripCost",
  "greedyMultiplier",
  // New tunable parameters
  "hopDistanceMultiplier",
  "ripCountExponent",
  "crossingExponent",
  "sameNetCrossingPenalty",
  "congestionRadius",
  "congestionPenaltyMultiplier",
  "connectionOrderWeight",
]

export interface SampleConfig {
  numCrossings: number
  seed: number
  rows: 1 | 2
  cols: 1 | 2
}

export interface EvaluationResult {
  continuousScore: number
  successRate: number
  totalRouted: number
  totalConnections: number
}

export function formatParams(params: Parameters): string {
  return [
    `portUsagePenalty=${params.portUsagePenalty.toFixed(3)}`,
    `portUsagePenaltySq=${params.portUsagePenaltySq.toFixed(3)}`,
    `crossingPenalty=${params.crossingPenalty.toFixed(3)}`,
    `crossingPenaltySq=${params.crossingPenaltySq.toFixed(3)}`,
    `ripCost=${params.ripCost.toFixed(3)}`,
    `greedyMultiplier=${params.greedyMultiplier.toFixed(3)}`,
    `hopDistMult=${params.hopDistanceMultiplier.toFixed(3)}`,
    `ripCountExp=${params.ripCountExponent.toFixed(3)}`,
    `crossingExp=${params.crossingExponent.toFixed(3)}`,
    `sameNetCross=${params.sameNetCrossingPenalty.toFixed(3)}`,
    `congRadius=${params.congestionRadius.toFixed(3)}`,
    `congMult=${params.congestionPenaltyMultiplier.toFixed(3)}`,
    `connOrderWt=${params.connectionOrderWeight.toFixed(3)}`,
  ].join(", ")
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function createZeroParams(): Parameters {
  return {
    portUsagePenalty: 0,
    portUsagePenaltySq: 0,
    crossingPenalty: 0,
    crossingPenaltySq: 0,
    ripCost: 0,
    greedyMultiplier: 0,
    hopDistanceMultiplier: 0,
    ripCountExponent: 0,
    crossingExponent: 0,
    sameNetCrossingPenalty: 0,
    congestionRadius: 0,
    congestionPenaltyMultiplier: 0,
    connectionOrderWeight: 0,
  }
}
