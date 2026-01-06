import type { Matrix } from "transformation-matrix"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"
import type { JumperGraph, JRegion, JPort } from "../jumper-types"
import { calculateGraphBounds } from "../jumper-graph-generator/calculateGraphBounds"
import { computeBoundsCenter } from "./getBoundsCenter"

/**
 * Applies a transformation matrix to all points in a graph.
 * Transforms region bounds, region centers, and port positions.
 */
export const applyTransformToGraph = (
  graph: JumperGraph,
  matrix: Matrix,
): JumperGraph => {
  const transformedRegions = graph.regions.map((region): JRegion => {
    const { bounds, center, ...rest } = region.d

    // Transform all four corners of the bounds
    const corners = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.maxX, y: bounds.maxY },
    ].map((corner) => applyToPoint(matrix, corner))

    // Calculate new bounds from transformed corners
    const newBounds = {
      minX: Math.min(...corners.map((c) => c.x)),
      maxX: Math.max(...corners.map((c) => c.x)),
      minY: Math.min(...corners.map((c) => c.y)),
      maxY: Math.max(...corners.map((c) => c.y)),
    }

    // Transform the center point
    const newCenter = applyToPoint(matrix, center)

    return {
      ...region,
      // Clear ports array - will be rebuilt with new port objects
      ports: [],
      d: {
        ...rest,
        bounds: newBounds,
        center: newCenter,
      },
    }
  })

  // Create a map from old region to new region
  const regionMap = new Map<JRegion, JRegion>()
  for (let i = 0; i < graph.regions.length; i++) {
    regionMap.set(graph.regions[i], transformedRegions[i])
  }

  // Transform ports
  const transformedPorts = graph.ports.map((port): JPort => {
    const newPosition = applyToPoint(matrix, port.d)
    const newRegion1 = regionMap.get(port.region1 as JRegion)!
    const newRegion2 = regionMap.get(port.region2 as JRegion)!

    const newPort: JPort = {
      ...port,
      region1: newRegion1,
      region2: newRegion2,
      d: newPosition,
    }

    // Add port references to the new regions
    newRegion1.ports.push(newPort)
    newRegion2.ports.push(newPort)

    return newPort
  })

  return {
    regions: transformedRegions,
    ports: transformedPorts,
  }
}

/**
 * Rotates a graph 90 degrees clockwise around its center.
 */
export const rotateGraph90Degrees = (graph: JumperGraph): JumperGraph => {
  const bounds = calculateGraphBounds(graph.regions)
  const center = computeBoundsCenter(bounds)

  // Create a rotation matrix: translate to origin, rotate, translate back
  const matrix = compose(
    translate(center.x, center.y),
    rotate(-Math.PI / 2), // -90 degrees (clockwise)
    translate(-center.x, -center.y),
  )

  return applyTransformToGraph(graph, matrix)
}
