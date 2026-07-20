import type { HeapObjectView } from '@/types/visualization.types'
import type { GraphNode } from './GraphNode'
import type { GraphEdge } from './GraphEdge'

/**
 * Maps JVM heap structures into linear lists of node and edge elements.
 * Ignores primitive types and filters duplicate nodes/edges.
 */
export class GraphBuilder {
  static build(objects: Record<string, HeapObjectView>): {
    nodes: GraphNode[]
    edges: GraphEdge[]
  } {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const nodeIds = new Set<string>()
    const edgeIds = new Set<string>()

    // 1. Create nodes for all heap objects
    for (const obj of Object.values(objects)) {
      if (!obj.objectId) continue
      if (!nodeIds.has(obj.objectId)) {
        nodeIds.add(obj.objectId)
        nodes.push({
          id: obj.objectId,
          type: obj.type === 'array' ? 'ARRAY' : 'OBJECT',
          classNameOrType: obj.classNameOrType,
          objectId: obj.objectId,
        })
      }

      // 2. Traversal references for edges
      const fields = obj.fieldsOrElements || {}
      for (const [fieldName, val] of Object.entries(fields)) {
        if (!val) continue
        if (val.kind === 'object_ref' || val.kind === 'array_ref') {
          const targetId = val.objectId ?? val.value ?? val.valueString
          if (!targetId || targetId === 'null' || targetId === '0x0000') continue

          // Unique Edge key between source and target nodes to prevent duplicate edges
          const edgeId = `${obj.objectId}-${targetId}`
          if (!edgeIds.has(edgeId)) {
            edgeIds.add(edgeId)
            edges.push({
              id: edgeId,
              source: obj.objectId,
              target: targetId,
              fieldName,
            })
          }
        }
      }
    }

    return { nodes, edges }
  }
}

export default GraphBuilder
