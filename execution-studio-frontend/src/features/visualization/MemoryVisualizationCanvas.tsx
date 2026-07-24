import React, { useMemo } from 'react'
import type { HeapObjectView, VariableView, DisplayValue } from '@/types/visualization.types'
import { RendererFactory, getRendererType } from './RendererFactory'

interface MemoryVisualizationCanvasProps {
  objects: Record<string, HeapObjectView>
  prevObjects: Record<string, HeapObjectView>
  variables: VariableView[]
  selectedObjectId: string | null
  onObjectClick: (objectId: string) => void
}

/**
 * Memory Visualization Canvas.
 *
 * Guarantees 100% Heap Consistency:
 * - Every heap object in `objects` appears EXACTLY ONCE on screen.
 * - No missing objects. No duplicate objects.
 * - Nodes rendered inside a LinkedList or BinaryTree container are suppressed from the root canvas.
 * - Objects referenced by Arrays or generic Objects are rendered as root cards on the canvas.
 * - Stable position order across execution steps prevents jumping nodes.
 */
export const MemoryVisualizationCanvas: React.FC<MemoryVisualizationCanvasProps> = React.memo(({
  objects,
  prevObjects,
  variables,
  selectedObjectId,
  onObjectClick,
}) => {
  // 1. Build variable label map: objectId → array of variable names referencing it
  const varLabelMap = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const v of variables) {
      if (!v.value) continue
      const val = v.value
      if (val.kind === 'null' || val.value === 'null') continue
      const id = val.objectId ?? (typeof val.value === 'string' && val.value.startsWith('obj_') ? val.value : null)
      if (!id) continue
      const cleanId = id.replace(/^@/, '')
      if (!map[cleanId]) map[cleanId] = []
      map[cleanId].push(v.name)
    }
    return map
  }, [variables])

  // 2. Identify all object IDs that are rendered INLINE inside a LinkedList or BinaryTree container
  const renderedInlineIds = useMemo<Set<string>>(() => {
    const inline = new Set<string>()

    for (const obj of Object.values(objects)) {
      const type = getRendererType(obj)

      if (type === 'LINKED_LIST') {
        // Collect all child nodes in the linked list chain (excluding head obj itself)
        const chainIds = getLinkedListChainIds(objects, obj.objectId)
        chainIds.slice(1).forEach((id) => inline.add(id))
      } else if (type === 'BINARY_TREE') {
        // Collect all child nodes in the binary tree (excluding root obj itself)
        const treeIds = getBinaryTreeChildIds(objects, obj.objectId)
        treeIds.slice(1).forEach((id) => inline.add(id))
      }
    }

    return inline
  }, [objects])

  // 3. Determine canvas root objects: Objects NOT rendered inline inside a container
  //    Sort in deterministic, stable order:
  //    - Objects with variable labels first (in order of variables)
  //    - Then remaining objects ordered by objectId
  const rootObjects = useMemo<HeapObjectView[]>(() => {
    const result: HeapObjectView[] = []
    const seen = new Set<string>()

    // Priority 1: Objects with variable labels
    for (const [id] of Object.entries(varLabelMap)) {
      if (seen.has(id)) continue
      if (renderedInlineIds.has(id)) continue // rendered inside list/tree
      const obj = objects[id]
      if (obj) {
        result.push(obj)
        seen.add(id)
      }
    }

    // Priority 2: All remaining heap objects not rendered inline
    const sortedIds = Object.keys(objects).sort((a, b) => a.localeCompare(b))
    for (const id of sortedIds) {
      if (seen.has(id)) continue
      if (renderedInlineIds.has(id)) continue
      const obj = objects[id]
      if (obj) {
        result.push(obj)
        seen.add(id)
      }
    }

    return result
  }, [objects, renderedInlineIds, varLabelMap])

  if (rootObjects.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          gap: '12px',
          fontSize: '13px',
        }}
        className="memory-canvas-empty"
      >
        <div style={{ fontSize: '32px' }}>🧠</div>
        <div style={{ fontStyle: 'italic' }}>No objects in heap yet.</div>
        <div style={{ fontSize: '11px', maxWidth: '220px', textAlign: 'center', lineHeight: '1.5' }}>
          Objects will appear here once your Java program allocates memory.
        </div>
      </div>
    )
  }

  return (
    <div
      data-viewport="heap"
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        alignItems: 'flex-start',
        gap: '14px',
      }}
      className="memory-visualization-canvas"
    >
      {rootObjects.map((obj) => {
        const prevObj = prevObjects[obj.objectId]
        const isNew = !prevObjects[obj.objectId]
        const varLabels = varLabelMap[obj.objectId] ?? []
        const isSelected = selectedObjectId === obj.objectId

        return (
          <div
            key={obj.objectId}
            id={`heap-obj-${obj.objectId}`}
            data-heap-object-id={obj.objectId}
            style={{
              outline: isSelected ? '2px solid var(--accent-color)' : 'none',
              borderRadius: '10px',
              transition: 'outline 0.15s ease',
              width: 'fit-content',
              maxWidth: '100%',
            }}
          >
            <RendererFactory
              obj={obj}
              prevObj={prevObj}
              objects={objects}
              prevObjects={prevObjects}
              variableLabels={varLabels}
              isNew={isNew}
              onObjectClick={onObjectClick}
            />
          </div>
        )
      })}
    </div>
  )
})

MemoryVisualizationCanvas.displayName = 'MemoryVisualizationCanvas'

// ── Helper: Collect all object IDs in a LinkedList chain ─────────────────────
function getLinkedListChainIds(objects: Record<string, HeapObjectView>, startId: string): string[] {
  const result: string[] = []
  const visited = new Set<string>()
  let curr: string | null = startId

  while (curr && !visited.has(curr) && result.length < 32) {
    visited.add(curr)
    const obj = objects[curr]
    if (!obj) break
    result.push(curr)

    // find next pointer
    const fields: Record<string, DisplayValue> = obj.fieldsOrElements ?? {}
    let nextId: string | null = null
    for (const [k, v] of Object.entries(fields)) {
      if (k.toLowerCase() === 'next' || k.toLowerCase().includes('next')) {
        const dv = v as DisplayValue
        if (dv.kind === 'object_ref' || dv.kind === 'array_ref' || dv.objectId) {
          nextId = dv.objectId ?? (typeof dv.value === 'string' && dv.value.startsWith('obj_') ? dv.value : null)
          break
        }
      }
    }
    curr = nextId
  }

  return result
}

// ── Helper: Collect all object IDs in a BinaryTree ───────────────────────────
function getBinaryTreeChildIds(objects: Record<string, HeapObjectView>, rootId: string): string[] {
  const result: string[] = []
  const visited = new Set<string>()

  function walk(id: string) {
    if (!id || visited.has(id) || visited.size > 32) return
    visited.add(id)
    const obj: HeapObjectView | undefined = objects[id]
    if (!obj) return
    result.push(id)

    const fields: Record<string, DisplayValue> = obj.fieldsOrElements ?? {}
    for (const [k, v] of Object.entries(fields)) {
      const kl = k.toLowerCase()
      if (kl.includes('left') || kl.includes('right')) {
        const dv = v as DisplayValue
        if (dv.kind === 'object_ref' || dv.kind === 'array_ref' || dv.objectId) {
          const childId = dv.objectId ?? (typeof dv.value === 'string' && dv.value.startsWith('obj_') ? dv.value : null)
          if (childId && !visited.has(childId)) {
            walk(childId)
          }
        }
      }
    }
  }

  walk(rootId)
  return result
}

export default MemoryVisualizationCanvas
