import type { GraphNode } from './GraphNode'
import type { GraphEdge } from './GraphEdge'

/**
 * Generic GraphModel representation independent from Cytoscape.js.
 */
export interface GraphModel {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
