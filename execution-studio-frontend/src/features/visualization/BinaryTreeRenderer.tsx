import React, { useEffect, useRef } from 'react'
import type { HeapObjectView } from '@/types/visualization.types'

interface BinaryTreeRendererProps {
  /** All heap objects in the heap snapshot */
  objects: Record<string, HeapObjectView>
  /** The root node objectId */
  rootObjectId: string
  /** Variable labels pointing to the root (e.g. ["root", "tree"]) */
  variableLabels: string[]
  /** Previous objects map for change detection */
  prevObjects?: Record<string, HeapObjectView>
  /** Called when a node is clicked */
  onNodeClick?: (objectId: string) => void
  /** True if this root was newly allocated this step */
  isNew?: boolean
}

const MAX_DEPTH = 8
const NODE_WIDTH = 48
const NODE_HEIGHT = 36
const H_SPACING = 16
const V_SPACING = 54

/**
 * Hierarchical Binary Tree Renderer.
 *
 * Example:
 *         50
 *       /    \
 *     30      70
 *    /  \    /  \
 *   20  35  60   80
 *
 * Uses canvas-free SVG-based edge drawing.
 * Cycle-safe tree traversal with max depth & visited guards.
 */
export const BinaryTreeRenderer: React.FC<BinaryTreeRendererProps> = React.memo(({
  objects,
  rootObjectId,
  variableLabels,
  prevObjects,
  onNodeClick,
  isNew = false,
}) => {
  // Lay out tree with visited set for cycle safety
  const visited = new Set<string>()
  const layout = computeLayout(objects, rootObjectId, 0, 0, 0, visited)
  if (!layout) return null

  const { positions, edges, width, height } = buildRenderData(layout)

  const svgWidth = Math.max(width + NODE_WIDTH * 2, 200)
  const svgHeight = Math.max(height + NODE_HEIGHT * 2, 120)

  return (
    <div
      className={isNew ? 'es-anim-fade-in' : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
      aria-label="Binary Tree"
    >
      {/* Variable labels above */}
      {variableLabels.length > 0 && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {variableLabels.map((lbl) => (
            <span
              key={lbl}
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-success)',
                fontWeight: 'bold',
              }}
            >
              {lbl}
            </span>
          ))}
        </div>
      )}

      {/* SVG canvas */}
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Draw edges first (behind nodes) */}
        {edges.map((edge) => (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="#475569"
            strokeWidth={1.5}
          />
        ))}

        {/* Draw nodes */}
        {positions.map(({ objectId, x, y }) => {
          const obj = objects[objectId]
          if (!obj) return null
          const prevObj = prevObjects?.[objectId]
          const isNodeNew = !prevObjects?.[objectId]
          const changed = prevObj ? didObjectChange(prevObj, obj) : false
          const value = getNodeValue(obj)

          return (
            <TreeNode
              key={objectId}
              objectId={objectId}
              x={x}
              y={y}
              value={value}
              isNew={isNodeNew}
              isChanged={changed}
              onClick={() => onNodeClick?.(objectId)}
            />
          )
        })}
      </svg>
    </div>
  )
})

BinaryTreeRenderer.displayName = 'BinaryTreeRenderer'

// ── SVG Tree Node ────────────────────────────────────────────────────────────

interface TreeNodeProps {
  objectId: string
  x: number
  y: number
  value: string
  isNew: boolean
  isChanged: boolean
  onClick?: () => void
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(({ objectId, x, y, value, isNew, isChanged, onClick }) => {
  const groupRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if ((isNew || isChanged) && groupRef.current) {
      const el = groupRef.current
      el.setAttribute('opacity', '0')
      const anim = el.animate([{ opacity: 0, transform: `scale(0.8)` }, { opacity: 1, transform: `scale(1)` }], {
        duration: 280,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      })
      anim.onfinish = () => {
        if (groupRef.current) groupRef.current.setAttribute('opacity', '1')
      }
    }
  }, [isNew, isChanged, objectId])

  const cx = x + NODE_WIDTH / 2
  const cy = y + NODE_HEIGHT / 2

  return (
    <g
      ref={groupRef}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      aria-label={`Tree node value ${value}`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={NODE_WIDTH / 2 - 2}
        fill={isNew ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)'}
        stroke={isNew ? '#10b981' : '#475569'}
        strokeWidth={isChanged ? 2.5 : 1.5}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="12"
        fontFamily="var(--font-mono)"
        fill={isNew ? '#10b981' : '#f9fafb'}
        fontWeight="bold"
      >
        {value}
      </text>
      <title>{`@${objectId}: ${value}`}</title>
    </g>
  )
})

TreeNode.displayName = 'TreeNode'

// ── Layout computation ───────────────────────────────────────────────────────

interface LayoutNode {
  objectId: string
  depth: number
  left: LayoutNode | null
  right: LayoutNode | null
  width: number
  x: number
}

function computeLayout(
  objects: Record<string, HeapObjectView>,
  objId: string,
  depth: number,
  xOffset: number,
  yOffset: number,
  visited: Set<string>,
): LayoutNode | null {
  if (!objId || depth > MAX_DEPTH || visited.has(objId)) return null
  const obj = objects[objId]
  if (!obj) return null

  visited.add(objId)

  const fields = obj.fieldsOrElements ?? {}
  const leftId = findChildId(fields, 'left')
  const rightId = findChildId(fields, 'right')

  const left = leftId && !visited.has(leftId) ? computeLayout(objects, leftId, depth + 1, xOffset, yOffset, visited) : null
  const right = rightId && !visited.has(rightId) ? computeLayout(objects, rightId, depth + 1, xOffset, yOffset, visited) : null

  const leftWidth = left ? left.width : NODE_WIDTH
  const rightWidth = right ? right.width : NODE_WIDTH
  const totalWidth = leftWidth + H_SPACING + rightWidth

  return {
    objectId: objId,
    depth,
    left,
    right,
    width: Math.max(NODE_WIDTH, totalWidth),
    x: 0,
  }
}

interface EdgeData {
  from: string
  to: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface RenderData {
  positions: { objectId: string; x: number; y: number }[]
  edges: EdgeData[]
  width: number
  height: number
}

function buildRenderData(root: LayoutNode): RenderData {
  const positions: { objectId: string; x: number; y: number }[] = []
  const edges: EdgeData[] = []
  let maxX = 0
  let maxY = 0

  function assign(node: LayoutNode, x: number, y: number) {
    node.x = x
    positions.push({ objectId: node.objectId, x, y })
    if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH
    if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT

    const cx = x + NODE_WIDTH / 2
    const cy = y + NODE_HEIGHT / 2

    if (node.left) {
      const leftX = x - (node.left.width / 2 + H_SPACING / 2)
      const leftY = y + V_SPACING
      edges.push({
        from: node.objectId,
        to: node.left.objectId,
        x1: cx - 10,
        y1: cy + NODE_HEIGHT / 2 - 2,
        x2: leftX + NODE_WIDTH / 2,
        y2: leftY + 2,
      })
      assign(node.left, leftX, leftY)
    }

    if (node.right) {
      const rightX = x + (node.right.width / 2 + H_SPACING / 2)
      const rightY = y + V_SPACING
      edges.push({
        from: node.objectId,
        to: node.right.objectId,
        x1: cx + 10,
        y1: cy + NODE_HEIGHT / 2 - 2,
        x2: rightX + NODE_WIDTH / 2,
        y2: rightY + 2,
      })
      assign(node.right, rightX, rightY)
    }
  }

  assign(root, root.width / 2, 10)
  return { positions, edges, width: maxX, height: maxY }
}

function findChildId(fields: Record<string, import('@/types/visualization.types').DisplayValue>, side: 'left' | 'right'): string | null {
  for (const [k, v] of Object.entries(fields)) {
    if (k.toLowerCase().includes(side)) {
      if (v.kind === 'null' || v.value === 'null') return null
      if (v.kind === 'object_ref' || v.kind === 'array_ref' || v.objectId) {
        const id = v.objectId ?? (typeof v.value === 'string' && v.value.startsWith('obj_') ? v.value : null)
        return id ?? null
      }
    }
  }
  return null
}

function getNodeValue(obj: HeapObjectView): string {
  const fields = obj.fieldsOrElements ?? {}
  for (const [k, v] of Object.entries(fields)) {
    if (!k.toLowerCase().includes('left') && !k.toLowerCase().includes('right')) {
      return String(v.valueString ?? v.value ?? '')
    }
  }
  return obj.objectId.slice(-3)
}

function didObjectChange(prev: HeapObjectView, curr: HeapObjectView): boolean {
  const pf = prev.fieldsOrElements ?? {}
  const cf = curr.fieldsOrElements ?? {}
  for (const k of Object.keys(cf)) {
    const pv = pf[k]
    const cv = cf[k]
    if (!pv) return true
    if (pv.valueString !== cv.valueString || pv.objectId !== cv.objectId) return true
  }
  return false
}

export default BinaryTreeRenderer
