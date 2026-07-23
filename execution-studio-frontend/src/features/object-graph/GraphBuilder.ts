import type { HeapObjectView, VariableView } from '@/types/visualization.types'
import type { GraphNode } from './GraphNode'
import type { GraphEdge } from './GraphEdge'
import type { GraphModel } from './GraphModel'
import { DataStructureClassifier } from './DataStructureClassifier'

/**
 * Constructs a generic GraphModel strictly adhering to the JVM Memory Model:
 * 1. Graph nodes represent ONLY heap objects (OBJECT, ARRAY, LINKED_LIST, BINARY_TREE, STACK, QUEUE, STRING).
 * 2. Local variables NEVER become graph nodes.
 * 3. Local variables referencing heap objects are attached as lightweight labels on referenced heap object nodes.
 * 4. Multiple variables referencing the same object attach as multiple labels on that single heap node.
 * 5. Object-to-object field references remain directed graph edges.
 * 6. Null references never generate graph nodes or graph edges.
 */
export class GraphBuilder {
  static build(
    objects: Record<string, HeapObjectView>,
    variables?: VariableView[],
  ): GraphModel {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const nodeMap = new Map<string, GraphNode>()
    const edgeIds = new Set<string>()

    if (!objects || typeof objects !== 'object') {
      return { nodes, edges }
    }

    // 1. Create graph nodes for all actual heap objects in current snapshot
    for (const obj of Object.values(objects)) {
      if (!obj || !obj.objectId) continue

      if (!nodeMap.has(obj.objectId)) {
        const typeStr = obj.classNameOrType || ''
        const { type, summary } = DataStructureClassifier.classify(obj)

        const node: GraphNode = {
          id: obj.objectId,
          type,
          classNameOrType: typeStr || 'java.lang.Object',
          objectId: obj.objectId,
          variableLabels: [],
          displaySummary: summary,
        }

        nodeMap.set(obj.objectId, node)
        nodes.push(node)
      }
    }

    // 2. Attach local stack frame variables as lightweight annotation labels on referenced heap nodes
    if (Array.isArray(variables)) {
      variables.forEach((v) => {
        if (!v || !v.value) return
        const val = v.value
        // Skip primitives or null values
        if (
          val.kind === 'null' ||
          val.value === 'null' ||
          val.valueString === 'null' ||
          val.value === null
        ) {
          return
        }

        const rawTargetId =
          val.objectId ||
          (typeof val.value === 'string' && val.value.startsWith('obj_') ? val.value : undefined)
        if (!rawTargetId || rawTargetId === 'null' || rawTargetId === '0x0000') return

        const targetId = rawTargetId.replace(/^@/, '')
        const targetNode = nodeMap.get(targetId)

        if (targetNode) {
          if (!targetNode.variableLabels) {
            targetNode.variableLabels = []
          }
          if (!targetNode.variableLabels.includes(v.name)) {
            targetNode.variableLabels.push(v.name)
          }
        }
      })
    }

    // 3. Traverse object fields to generate directed graph edges
    for (const obj of Object.values(objects)) {
      if (!obj || !obj.objectId) continue

      const fields = obj.fieldsOrElements || {}
      for (const [fieldName, val] of Object.entries(fields)) {
        if (!val) continue

        // Rule: Null references must NEVER generate graph edges
        if (
          val.kind === 'null' ||
          val.value === 'null' ||
          val.valueString === 'null' ||
          val.value === null
        ) {
          continue
        }

        // Rule: Only explicit object/array reference kinds generate edges
        const isRefKind =
          val.kind === 'object_ref' ||
          val.kind === 'array_ref' ||
          Boolean(val.objectId && val.objectId !== 'null' && val.objectId !== '0x0000')

        if (!isRefKind) continue

        const rawTargetId =
          val.objectId ||
          (typeof val.value === 'string' && val.value.startsWith('obj_') ? val.value : undefined)
        if (!rawTargetId || rawTargetId === 'null' || rawTargetId === '0x0000') continue

        const targetId = rawTargetId.replace(/^@/, '')
        if (!targetId || !nodeMap.has(targetId)) continue

        const edgeId = `${obj.objectId}-${fieldName}-${targetId}`
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

    return { nodes, edges }
  }
}

export default GraphBuilder
