import type { Bounds, RegionRef, RegionData } from "./types"
import { TopologyError } from "./types"

export class RegionBuilder implements RegionRef {
  private data: RegionData

  constructor(id: string) {
    this.data = {
      id,
      bounds: null,
      center: null,
      width: null,
      height: null,
      anchor: "center",
      isPad: false,
      isThroughJumper: false,
      isConnectionRegion: false,
      meta: {},
    }
  }

  get id(): string {
    return this.data.id
  }

  // Geometry methods

  rect(b: Bounds): this {
    this.data.bounds = { ...b }
    // Clear center/size if rect is used
    this.data.center = null
    this.data.width = null
    this.data.height = null
    return this
  }

  center(x: number, y: number): this {
    this.data.center = { x, y }
    // Clear bounds if center/size approach is used
    this.data.bounds = null
    return this
  }

  size(w: number, h: number, anchor: "center" | "min" = "center"): this {
    if (w <= 0 || h <= 0) {
      throw new TopologyError(
        `Region "${this.data.id}" has invalid size: width (${w}) and height (${h}) must be positive`,
        {
          regionIds: [this.data.id],
          suggestion: "Use positive values for width and height",
        },
      )
    }
    this.data.width = w
    this.data.height = h
    this.data.anchor = anchor
    // Clear bounds if center/size approach is used
    this.data.bounds = null
    return this
  }

  // Semantic methods

  pad(isPad: boolean = true): this {
    this.data.isPad = isPad
    return this
  }

  throughJumper(isTJ: boolean = true): this {
    this.data.isThroughJumper = isTJ
    return this
  }

  connectionRegion(isConn: boolean = true): this {
    this.data.isConnectionRegion = isConn
    return this
  }

  meta(extra: Record<string, unknown>): this {
    this.data.meta = { ...this.data.meta, ...extra }
    return this
  }

  // Get the internal data (used by Topology)
  getData(): RegionData {
    return this.data
  }

  // Get a reference to this region
  ref(): RegionRef {
    return { id: this.data.id }
  }
}
