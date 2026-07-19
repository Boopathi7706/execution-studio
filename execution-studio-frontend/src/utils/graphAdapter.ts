import type { ReferenceGraph } from '@/types/visualization.types'

interface CytoscapeElement {
  data: {
    id: string
    label?: string
    type?: string
    source?: string
    target?: string
  }
}

/**
 * Converts a ReferenceGraph model into standard Cytoscape elements structure.
 */
export function adaptGraphToCytoscape(
  graph: ReferenceGraph | null | undefined,
): CytoscapeElement[] {
  if (!graph) return []

  const nodes = (graph.nodes || []).map((node) => ({
    data: { id: node.id, label: node.label, type: node.type },
  }))

  const edges = (graph.edges || []).map((edge, idx) => ({
    data: {
      id: `edge-${idx}`,
      source: edge.source,
      target: edge.target,
      label: edge.relationshipType,
    },
  }))

  return [...nodes, ...edges]
}
