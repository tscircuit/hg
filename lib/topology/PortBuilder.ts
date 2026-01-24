import type { RegionRef, PortData, Bounds } from "./types"
import { TopologyError } from "./types"
import {
  findSharedBoundary,
  computePortPositionOnBoundary,
  pointOnBoundary,
} from "./utils"

type ResolveRegionFn = (ref: RegionRef | string) => { id: string; bounds: Bounds }
type AddPortFn = (port: PortData) => void

export class PortBuilder {
  private portId: string
  private region1Id: string | null = null
  private region2Id: string | null = null
  private position: { x: number; y: number } | null = null
  private tValue: number | null = null
  private resolveRegionFn: ResolveRegionFn
  private addPortFn: AddPortFn
  private tolerance: number

  constructor(
    id: string,
    resolveRegionFn: ResolveRegionFn,
    addPortFn: AddPortFn,
    tolerance: number = 0.001,
  ) {
    this.portId = id
    this.resolveRegionFn = resolveRegionFn
    this.addPortFn = addPortFn
    this.tolerance = tolerance
  }

  id(id: string): this {
    this.portId = id
    return this
  }

  between(a: RegionRef | string, b: RegionRef | string): this {
    this.region1Id = typeof a === "string" ? a : a.id
    this.region2Id = typeof b === "string" ? b : b.id
    return this
  }

  onSharedEdge(t: number = 0.5): this {
    if (t < 0 || t > 1) {
      throw new TopologyError(`Position t=${t} is out of range [0, 1]`, {
        suggestion: "Use a value between 0 and 1",
      })
    }
    this.tValue = t
    this.position = null
    return this
  }

  at(p: { x: number; y: number }): this {
    this.position = { x: p.x, y: p.y }
    this.tValue = null
    return this
  }

  done(): void {
    if (!this.region1Id || !this.region2Id) {
      throw new TopologyError(
        `Port "${this.portId}" must be between two regions`,
        {
          suggestion: "Use .between(regionA, regionB) before .done()",
        },
      )
    }

    const region1 = this.resolveRegionFn(this.region1Id)
    const region2 = this.resolveRegionFn(this.region2Id)

    let finalPosition: { x: number; y: number }

    if (this.position) {
      // Direct coordinate placement
      finalPosition = this.position

      // Optionally validate that position is on boundaries
      const onBoundary1 = pointOnBoundary(
        this.position,
        region1.bounds,
        this.tolerance,
      )
      const onBoundary2 = pointOnBoundary(
        this.position,
        region2.bounds,
        this.tolerance,
      )

      if (!onBoundary1 && !onBoundary2) {
        // This is allowed for throughjumper-style ports, but we could warn
        // For now, we allow it silently as per the design doc
      }
    } else {
      // Use shared boundary
      const t = this.tValue ?? 0.5

      try {
        const boundary = findSharedBoundary(
          region1.bounds,
          region2.bounds,
          this.region1Id,
          this.region2Id,
          this.tolerance,
        )
        finalPosition = computePortPositionOnBoundary(boundary, t)
      } catch (e) {
        if (e instanceof TopologyError && this.position === null) {
          throw new TopologyError(
            `Port "${this.portId}": ${e.message}. No explicit position provided.`,
            {
              ...e.details,
              suggestion:
                "Use .at({ x, y }) to specify position for non-adjacent regions",
            },
          )
        }
        throw e
      }
    }

    this.addPortFn({
      id: this.portId,
      region1Id: this.region1Id,
      region2Id: this.region2Id,
      x: finalPosition.x,
      y: finalPosition.y,
    })
  }
}
