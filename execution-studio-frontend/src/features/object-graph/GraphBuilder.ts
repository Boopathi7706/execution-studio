import type { HeapObjectView } from '@/types/visualization.types'
import type { GraphNode, GraphNodeType } from './GraphNode'
import type { GraphEdge } from './GraphEdge'
import type { GraphModel } from './GraphModel'

/**
 * Constructs a generic GraphModel from JVM heap snapshots.
 * Completely independent from Cytoscape.js or UI rendering layers.
 */
export class GraphBuilder {
  static build(objects: Record<string, HeapObjectView>): GraphModel {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const nodeIds = new Set<string>()
    const edgeIds = new Set<string>()

    if (!objects || typeof objects !== 'object') {
      return { nodes, edges }
    }

    // 1. Create nodes for all heap objects in current frame snapshot
    for (const obj of Object.values(objects)) {
      if (!obj || !obj.objectId) continue

      if (!nodeIds.has(obj.objectId)) {
        nodeIds.add(obj.objectId)

        let type: GraphNodeType = 'OBJECT'
        const typeStr = obj.classNameOrType || ''

        if (typeStr === 'java.lang.String' || typeStr === 'String') {
          type = 'STRING'
        } else if (
          obj.type === 'array' ||
          typeStr.endsWith('[]') ||
          typeStr.includes('[]')
        ) {
          type = 'ARRAY'
        }

        nodes.push({
          id: obj.objectId,
          type,
          classNameOrType: typeStr || 'java.lang.Object',
          objectId: obj.objectId,
        })
      }
    }

    // 2. Traversal reference fields to generate directed edges
    for (const obj of Object.values(objects)) {
      if (!obj || !obj.objectId) continue

      const fields = obj.fieldsOrElements || {}
      for (const [fieldName, val] of Object.entries(fields)) {
        if (!val) continue

        const rawTargetId = val.objectId || (typeof val.value === 'string' ? val.value : val.valueString)
        const isRefKind = val.kind === 'object_ref' || val.kind === 'array_ref'
        const isRefObjId = Boolean(val.objectId && val.objectId !== obj.objectId && val.objectId !== 'null' && val.objectId !== '0x0000')

        if ((isRefKind || isRefObjId) && rawTargetId) {
          if (rawTargetId === 'null' || rawTargetId === '0x0000') continue

          const targetId = rawTargetId.replace(/^@/, '')
          if (!targetId || targetId === obj.objectId) continue

          // Ensure target node exists in nodes array; if missing, create placeholder target node
          if (!nodeIds.has(targetId)) {
            nodeIds.add(targetId)
            nodes.push({
              id: targetId,
              type: 'OBJECT',
              classNameOrType: val.kind === 'array_ref' ? 'Array' : 'Object',
              objectId: targetId,
            })
          }

          // Edge ID key between source and target object to prevent duplicate edges
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
