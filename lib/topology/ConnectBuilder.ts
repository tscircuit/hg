import type { PortSpread, PortData, SharedBoundary, Bounds } from "./types"
import { TopologyError } from "./types"
import {
  findSharedBoundary,
  computePortPositionOnBoundary,
  computeEvenPortPositions,
} from "./utils"

type AddPortFn = (port: PortData) => void
type PrefixIdFn = (id: string) => string

export class ConnectBuilder {
  private region1Id: string
  private region2Id: string
  private bounds1: Bounds
  private bounds2: Bounds
  private tolerance: number
  private prefix: string
  private prefixIdFn: PrefixIdFn
  private addPortFn: AddPortFn
  private portIds: string[] = []
  private boundary: SharedBoundary | null = null
  private prefixWasExplicitlySet: boolean = false

  constructor(
    region1Id: string,
    region2Id: string,
    bounds1: Bounds,
    bounds2: Bounds,
    addPortFn: AddPortFn,
    prefixIdFn: PrefixIdFn,
    opts?: { idPrefix?: string; tolerance?: number },
  ) {
    this.region1Id = region1Id
    this.region2Id = region2Id
    this.bounds1 = bounds1
    this.bounds2 = bounds2
    this.addPortFn = addPortFn
    this.prefixIdFn = prefixIdFn
    this.tolerance = opts?.tolerance ?? 0.001
    // Default prefix is computed from region IDs (already prefixed by Topology)
    this.prefix = opts?.idPrefix ?? `${region1Id.split(":").pop()}-${region2Id.split(":").pop()}`
  }

  private ensureBoundary(): SharedBoundary {
    if (!this.boundary) {
      this.boundary = findSharedBoundary(
        this.bounds1,
        this.bounds2,
        this.region1Id,
        this.region2Id,
        this.tolerance,
      )
    }
    return this.boundary
  }

  idPrefix(prefix: string): this {
    this.prefix = prefix
    this.prefixWasExplicitlySet = true
    return this
  }

  private getFullPrefix(): string {
    // If prefix was explicitly set, apply scope prefix
    // If using default, it's already derived from scoped region IDs
    if (this.prefixWasExplicitlySet) {
      return this.prefixIdFn(this.prefix)
    }
    return this.prefixIdFn(this.prefix)
  }

  ports(count: number, spread?: PortSpread): this {
    if (count <= 0) {
      throw new TopologyError(
        `Invalid port count: ${count}. Must be at least 1`,
        {
          regionIds: [this.region1Id, this.region2Id],
          suggestion: "Use a positive integer for port count",
        },
      )
    }

    const boundary = this.ensureBoundary()

    let positions: { x: number; y: number }[]

    if (!spread || spread.kind === "midpoint") {
      // Default: single port at midpoint
      if (count === 1) {
        positions = [computePortPositionOnBoundary(boundary, 0.5)]
      } else {
        // For multiple ports with midpoint spread, use even distribution
        positions = computeEvenPortPositions(boundary, count, "half")
      }
    } else if (spread.kind === "even") {
      positions = computeEvenPortPositions(boundary, count, spread.inset)
    } else if (spread.kind === "fractions") {
      if (spread.ts.length !== count) {
        throw new TopologyError(
          `Port count (${count}) doesn't match fractions array length (${spread.ts.length})`,
          {
            regionIds: [this.region1Id, this.region2Id],
            suggestion: "Ensure fractions array has exactly `count` elements",
          },
        )
      }
      positions = spread.ts.map((t) => {
        if (t < 0 || t > 1) {
          throw new TopologyError(
            `Fraction value ${t} is out of range [0, 1]`,
            {
              regionIds: [this.region1Id, this.region2Id],
              suggestion: "Use values between 0 and 1 for fractions",
            },
          )
        }
        return computePortPositionOnBoundary(boundary, t)
      })
    } else {
      throw new TopologyError(`Unknown spread kind`, {
        regionIds: [this.region1Id, this.region2Id],
      })
    }

    const fullPrefix = this.getFullPrefix()
    for (let i = 0; i < positions.length; i++) {
      const portId = count === 1 ? fullPrefix : `${fullPrefix}:${i}`
      this.addPortFn({
        id: portId,
        region1Id: this.region1Id,
        region2Id: this.region2Id,
        x: positions[i].x,
        y: positions[i].y,
      })
      this.portIds.push(portId)
    }

    return this
  }

  at(t: number): this {
    if (t < 0 || t > 1) {
      throw new TopologyError(`Position t=${t} is out of range [0, 1]`, {
        regionIds: [this.region1Id, this.region2Id],
        suggestion: "Use a value between 0 and 1",
      })
    }

    const boundary = this.ensureBoundary()
    const position = computePortPositionOnBoundary(boundary, t)
    const fullPrefix = this.getFullPrefix()

    this.addPortFn({
      id: fullPrefix,
      region1Id: this.region1Id,
      region2Id: this.region2Id,
      x: position.x,
      y: position.y,
    })
    this.portIds.push(fullPrefix)

    return this
  }

  atXY(p: { x: number; y: number }): this {
    const fullPrefix = this.getFullPrefix()
    this.addPortFn({
      id: fullPrefix,
      region1Id: this.region1Id,
      region2Id: this.region2Id,
      x: p.x,
      y: p.y,
    })
    this.portIds.push(fullPrefix)

    return this
  }

  getPortIds(): string[] {
    // If no ports were added yet, add a default single port
    if (this.portIds.length === 0) {
      this.ports(1)
    }
    return [...this.portIds]
  }

  // Called by Topology.toJumperGraph() to ensure default ports are created
  finalizeIfNeeded(): void {
    if (this.portIds.length === 0) {
      this.ports(1)
    }
  }

  // Check if ports have already been added
  hasPortsAdded(): boolean {
    return this.portIds.length > 0
  }
}
