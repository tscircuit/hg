import type { GraphicsObject } from "graphics-debug"
import { HyperGraphSolver } from "../HyperGraphSolver"
import type {
  Connection,
  HyperGraph,
  RegionPortAssignment,
  SerializedConnection,
  SerializedHyperGraph,
  SolvedRoute,
} from "../types"
import type { JPort, JRegion } from "./jumper-types"
import { visualizeJumperGraphSolver } from "./visualizeJumperGraphSolver"
import { distance } from "@tscircuit/math-utils"
import { computeDifferentNetCrossings } from "./computeDifferentNetCrossings"
import { computeCrossingAssignments } from "./computeCrossingAssignments"
import { computeSameNetCrossings } from "./computeSameNetCrossings"

export const JUMPER_GRAPH_SOLVER_DEFAULTS = {
  portUsagePenalty: 0.03365268465229554,
  portUsagePenaltySq: 0.001,
  crossingPenalty: 6.160693673577123,
  crossingPenaltySq: 0.06126198189275256,
  ripCost: 39.97123937131205,
  greedyMultiplier: 0.5293456817395028,
  // New tunable parameters
  hopDistanceMultiplier: 0.9401216030689439,
  ripCountExponent: 1.9553157504245895,
  crossingExponent: 1.8768621932810199,
  sameNetCrossingPenalty: 0.5282307574660395,
  congestionRadius: 0.4188103484385634,
  congestionPenaltyMultiplier: 0.12244797149538383,
  connectionOrderWeight: 0.04368861909045532,
}

export class JumperGraphSolver extends HyperGraphSolver<JRegion, JPort> {
  UNIT_OF_COST = "distance"

  portUsagePenalty = JUMPER_GRAPH_SOLVER_DEFAULTS.portUsagePenalty
  portUsagePenaltySq = JUMPER_GRAPH_SOLVER_DEFAULTS.portUsagePenaltySq
  crossingPenalty = JUMPER_GRAPH_SOLVER_DEFAULTS.crossingPenalty
  crossingPenaltySq = JUMPER_GRAPH_SOLVER_DEFAULTS.crossingPenaltySq
  override ripCost = JUMPER_GRAPH_SOLVER_DEFAULTS.ripCost
  baseMaxIterations = 4000
  additionalMaxIterationsPerConnection = 4000

  // New tunable parameters
  hopDistanceMultiplier = JUMPER_GRAPH_SOLVER_DEFAULTS.hopDistanceMultiplier
  ripCountExponent = JUMPER_GRAPH_SOLVER_DEFAULTS.ripCountExponent
  crossingExponent = JUMPER_GRAPH_SOLVER_DEFAULTS.crossingExponent
  sameNetCrossingPenalty = JUMPER_GRAPH_SOLVER_DEFAULTS.sameNetCrossingPenalty
  congestionRadius = JUMPER_GRAPH_SOLVER_DEFAULTS.congestionRadius
  congestionPenaltyMultiplier =
    JUMPER_GRAPH_SOLVER_DEFAULTS.congestionPenaltyMultiplier
  connectionOrderWeight = JUMPER_GRAPH_SOLVER_DEFAULTS.connectionOrderWeight

  constructor(input: {
    inputGraph: HyperGraph | SerializedHyperGraph
    inputConnections: (Connection | SerializedConnection)[]
    ripCost?: number
    portUsagePenalty?: number
    crossingPenalty?: number
    baseMaxIterations?: number
    additionalMaxIterationsPerConnection?: number
    // New tunable parameters
    hopDistanceMultiplier?: number
    ripCountExponent?: number
    crossingExponent?: number
    sameNetCrossingPenalty?: number
    congestionRadius?: number
    congestionPenaltyMultiplier?: number
    connectionOrderWeight?: number
  }) {
    super({
      greedyMultiplier: JUMPER_GRAPH_SOLVER_DEFAULTS.greedyMultiplier,
      rippingEnabled: true,
      ...input,
    })
    this.ripCost = input.ripCost ?? this.ripCost
    this.portUsagePenalty = input.portUsagePenalty ?? this.portUsagePenalty
    this.crossingPenalty = input.crossingPenalty ?? this.crossingPenalty
    this.baseMaxIterations = input.baseMaxIterations ?? this.baseMaxIterations
    this.additionalMaxIterationsPerConnection =
      input.additionalMaxIterationsPerConnection ??
      this.additionalMaxIterationsPerConnection

    // Initialize new tunable parameters
    this.hopDistanceMultiplier =
      input.hopDistanceMultiplier ?? this.hopDistanceMultiplier
    this.ripCountExponent = input.ripCountExponent ?? this.ripCountExponent
    this.crossingExponent = input.crossingExponent ?? this.crossingExponent
    this.sameNetCrossingPenalty =
      input.sameNetCrossingPenalty ?? this.sameNetCrossingPenalty
    this.congestionRadius = input.congestionRadius ?? this.congestionRadius
    this.congestionPenaltyMultiplier =
      input.congestionPenaltyMultiplier ?? this.congestionPenaltyMultiplier
    this.connectionOrderWeight =
      input.connectionOrderWeight ?? this.connectionOrderWeight

    this.MAX_ITERATIONS =
      this.baseMaxIterations +
      input.inputConnections.length * this.additionalMaxIterationsPerConnection

    this.populateDistanceToEndMaps()

    // Sort connections by estimated difficulty if connectionOrderWeight is set
    if (this.connectionOrderWeight !== 0) {
      this.sortConnectionsByDifficulty()
    }
  }

  /**
   * Sort connections by estimated difficulty (hop distance).
   * Positive connectionOrderWeight: easier (shorter) connections first
   * Negative connectionOrderWeight: harder (longer) connections first
   */
  private sortConnectionsByDifficulty() {
    const getConnectionDifficulty = (conn: Connection): number => {
      // Estimate difficulty as minimum hop distance between start and end
      let minHops = Infinity
      for (const port of conn.startRegion.ports) {
        const hops = (port as JPort).distanceToEndMap?.[conn.endRegion.regionId]
        if (hops !== undefined && hops < minHops) {
          minHops = hops
        }
      }
      return minHops === Infinity ? 0 : minHops
    }

    this.unprocessedConnections.sort((a, b) => {
      const diffA = getConnectionDifficulty(a)
      const diffB = getConnectionDifficulty(b)
      // Positive weight: easier first (ascending), Negative: harder first (descending)
      return (diffA - diffB) * Math.sign(this.connectionOrderWeight)
    })
  }

  private populateDistanceToEndMaps() {
    // Get all unique end regions from connections
    const endRegions = new Set(this.connections.map((c) => c.endRegion))

    // For each end region, compute hop distances from all ports using BFS
    for (const endRegion of endRegions) {
      const regionDistanceMap = new Map<string, number>()
      const queue: Array<{ region: JRegion; distance: number }> = []

      regionDistanceMap.set(endRegion.regionId, 0)
      queue.push({ region: endRegion as JRegion, distance: 0 })

      while (queue.length > 0) {
        const { region, distance: dist } = queue.shift()!

        for (const port of region.ports) {
          const otherRegion = (
            port.region1 === region ? port.region2 : port.region1
          ) as JRegion
          if (!regionDistanceMap.has(otherRegion.regionId)) {
            regionDistanceMap.set(otherRegion.regionId, dist + 1)
            queue.push({ region: otherRegion, distance: dist + 1 })
          }
        }
      }

      // Populate each port's distanceToEndMap for this end region
      for (const port of this.graph.ports) {
        if (!port.distanceToEndMap) {
          port.distanceToEndMap = {}
        }
        const d1 = regionDistanceMap.get(port.region1.regionId) ?? Infinity
        const d2 = regionDistanceMap.get(port.region2.regionId) ?? Infinity
        port.distanceToEndMap[endRegion.regionId] = Math.min(d1, d2)
      }
    }
  }

  override estimateCostToEnd(port: JPort): number {
    const endRegionId = this.currentEndRegion!.regionId
    const hopDistance = port.distanceToEndMap![endRegionId]!
    return hopDistance * this.hopDistanceMultiplier
  }

  override getPortUsagePenalty(port: JPort): number {
    const ripCount = port.ripCount ?? 0
    // Linear term + polynomial term with configurable exponent
    const linearPenalty = ripCount * this.portUsagePenalty
    const polynomialPenalty =
      Math.pow(ripCount, this.ripCountExponent) * this.portUsagePenaltySq

    // Congestion penalty: penalize ports near heavily-used ports
    const congestionPenalty = this.computeCongestionPenalty(port)

    return linearPenalty + polynomialPenalty + congestionPenalty
  }

  /**
   * Compute congestion penalty based on nearby port usage.
   * Ports within congestionRadius of heavily-used ports get penalized.
   */
  private computeCongestionPenalty(port: JPort): number {
    if (this.congestionRadius <= 0 || this.congestionPenaltyMultiplier <= 0) {
      return 0
    }

    let totalNearbyRipCount = 0
    const portX = port.d.x
    const portY = port.d.y

    for (const otherPort of this.graph.ports) {
      if (otherPort === port) continue

      const dx = (otherPort as JPort).d.x - portX
      const dy = (otherPort as JPort).d.y - portY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= this.congestionRadius) {
        // Weight by inverse distance (closer = more penalty)
        const weight = 1 - dist / this.congestionRadius
        totalNearbyRipCount += ((otherPort as JPort).ripCount ?? 0) * weight
      }
    }

    return totalNearbyRipCount * this.congestionPenaltyMultiplier
  }

  override computeIncreasedRegionCostIfPortsAreUsed(
    region: JRegion,
    port1: JPort,
    port2: JPort,
  ): number {
    // Different-net crossings (the main penalty)
    const differentNetCrossings = computeDifferentNetCrossings(
      region,
      port1,
      port2,
    )
    const differentNetPenalty =
      differentNetCrossings * this.crossingPenalty +
      Math.pow(differentNetCrossings, this.crossingExponent) *
        this.crossingPenaltySq

    // Same-net crossings (smaller penalty, but still worth avoiding)
    const sameNetCrossings = computeSameNetCrossings(
      region,
      port1,
      port2,
      this.currentConnection!.mutuallyConnectedNetworkId,
    )
    const sameNetPenalty = sameNetCrossings * this.sameNetCrossingPenalty

    return differentNetPenalty + sameNetPenalty
  }

  override getRipsRequiredForPortUsage(
    region: JRegion,
    port1: JPort,
    port2: JPort,
  ): RegionPortAssignment[] {
    const crossingAssignments = computeCrossingAssignments(region, port1, port2)
    // Filter out same-network crossings since those don't require ripping
    return crossingAssignments.filter(
      (a) =>
        a.connection.mutuallyConnectedNetworkId !==
        this.currentConnection!.mutuallyConnectedNetworkId,
    )
  }

  override routeSolvedHook(solvedRoute: SolvedRoute) {}

  override routeStartedHook(connection: Connection) {}

  override visualize(): GraphicsObject {
    return visualizeJumperGraphSolver(this)
  }
}
