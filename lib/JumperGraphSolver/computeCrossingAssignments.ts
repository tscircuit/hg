import type { RegionPortAssignment } from "../types"
import type { JPort, JRegion } from "./jumper-types"
import { perimeterT, chordsCross } from "./perimeterChordUtils"

/**
 * Compute the assignments that would cross with a new port pair in the region.
 *
 * Uses the circle/perimeter mapping approach: two connections MUST cross
 * if their boundary points interleave around the perimeter.
 *
 * Returns the actual RegionPortAssignment objects that would cross with the
 * new port pair, allowing callers to determine which routes need to be ripped.
 */
export function computeCrossingAssignments(
  region: JRegion,
  port1: JPort,
  port2: JPort,
): RegionPortAssignment[] {
  const { minX: xmin, maxX: xmax, minY: ymin, maxY: ymax } = region.d.bounds

  // Map the new port pair to perimeter coordinates
  const t1 = perimeterT(port1.d, xmin, xmax, ymin, ymax)
  const t2 = perimeterT(port2.d, xmin, xmax, ymin, ymax)
  const newChord: [number, number] = [t1, t2]

  // Find assignments that cross with the new chord
  const crossingAssignments: RegionPortAssignment[] = []
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
      crossingAssignments.push(assignment)
    }
  }

  return crossingAssignments
}
