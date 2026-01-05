import type { JPort, JRegion } from "./jumper-types"
import { perimeterT, chordsCross } from "./perimeterChordUtils"

/**
 * Compute the number of crossings between a new port pair and existing
 * assignments in the region.
 *
 * Uses the circle/perimeter mapping approach: two connections MUST cross
 * if their boundary points interleave around the perimeter.
 */
export function computeDifferentNetCrossings(
  region: JRegion,
  port1: JPort,
  port2: JPort,
): number {
  const { minX: xmin, maxX: xmax, minY: ymin, maxY: ymax } = region.d.bounds

  // Map the new port pair to perimeter coordinates
  const t1 = perimeterT(port1.d, xmin, xmax, ymin, ymax)
  const t2 = perimeterT(port2.d, xmin, xmax, ymin, ymax)
  const newChord: [number, number] = [t1, t2]

  // Count crossings with existing assignments
  let crossings = 0
  const assignments = region.assignments ?? []

  for (const assignment of assignments) {
    const existingT1 = perimeterT(
      (assignment.regionPort1 as JPort).d,
      xmin,
      xmax,
      ymin,
      ymax,
    )
    const existingT2 = perimeterT(
      (assignment.regionPort2 as JPort).d,
      xmin,
      xmax,
      ymin,
      ymax,
    )
    const existingChord: [number, number] = [existingT1, existingT2]

    if (chordsCross(newChord, existingChord)) {
      crossings++
    }
  }

  return crossings
}
