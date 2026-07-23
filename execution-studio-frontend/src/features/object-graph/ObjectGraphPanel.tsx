import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import cytoscape from 'cytoscape'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView } from '@/types/visualization.types'
import GraphBuilder from './GraphBuilder'
import GraphLegend from './GraphLegend'
import GraphSearchToolbar from './GraphSearchToolbar'
import GRAPH_THEME from './graph.theme'
import { memoryLayoutEngine } from './MemoryCanvasLayoutEngine'

const EMPTY_OBJECTS: Record<string, HeapObjectView> = {}

/**
 * Formats display values inside the side inspector panel.
 */
const formatInspectorValue = (kind: string, rawVal: string): string => {
  if (kind === 'null' || rawVal === 'null') return 'null'
  if (kind === 'string') {
    if (rawVal.startsWith('"') && rawVal.endsWith('"')) return rawVal
    return `"${rawVal}"`
  }
  if (kind === 'object_ref' || kind === 'array_ref') {
    if (rawVal.includes('@')) return rawVal
    return `@${rawVal}`
  }
  return rawVal
}

/**
 * Educational JVM Memory Canvas Component using Cytoscape.js.
 * Displays specialized data structures using intuitive textbook layouts:
 * - Arrays: Sequential indexed element blocks
 * - Linked Lists: Horizontal node chains (data | next)
 * - Binary Trees: Hierarchical parent-child branching
 * - Stacks: Vertical stack frames
 * - General Objects: Memory cards with Class Name, data summary, and small @objectId
 */
export const ObjectGraphPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

  const isConnected = connectionStatus === 'CONNECTED'

  // Read heap objects and active variables from active playback model
  const objects =
    isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : EMPTY_OBJECTS
  const variables =
    isConnected && currentModel?.variables?.variables ? currentModel.variables.variables : []

  // 1. Build generic GraphModel using GraphBuilder (Adaptive data structure nodes + Stack variable labels)
  const { nodes, edges } = useMemo(() => {
    return GraphBuilder.build(objects, variables)
  }, [objects, variables])

  // Helper: Format Cytoscape node label with variable pin tags and data summaries
  const getNodeLabel = useCallback(
    (node: { classNameOrType: string; objectId: string; variableLabels?: string[]; displaySummary?: string }) => {
      const varsTag =
        node.variableLabels && node.variableLabels.length > 0
          ? `📌 [${node.variableLabels.join(', ')}]\n`
          : ''
      const summaryTag = node.displaySummary ? `\n${node.displaySummary}` : ''
      return `${varsTag}${node.classNameOrType}${summaryTag}\n@${node.objectId}`
    },
    [],
  )

  // Helper: Explicit full layout re-computation (cose layout + fit)
  const handleResetLayout = useCallback(() => {
    memoryLayoutEngine.clear()
    const cy = cyRef.current
    if (!cy) return
    try {
      const layout = cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 300,
        refresh: 20,
        fit: true,
        padding: 35,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 120,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      layout.run()
    } catch {
      // Graceful fallback for non-canvas environments
    }
  }, [])

  // 2. Initialize Cytoscape core instance ONCE on mount
  useEffect(() => {
    if (!containerRef.current || !isConnected) return

    let cy: cytoscape.Core | null = null
    try {
      cy = cytoscape({
        container: containerRef.current,
        elements: [],
        boxSelectionEnabled: false,
        autounselectify: false,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': GRAPH_THEME.colors.objectNode,
              label: 'data(label)',
              color: GRAPH_THEME.colors.nodeText,
              'font-size': '11px',
              'font-family': 'var(--font-sans)',
              'text-wrap': 'wrap',
              'text-valign': 'center',
              'text-halign': 'center',
              width: '80px',
              height: '70px',
              shape: 'round-rectangle',
              'border-width': GRAPH_THEME.dimensions.borderWidth,
              'border-color': GRAPH_THEME.colors.nodeBorder,
            },
          },
          {
            selector: 'node[type="ARRAY"]',
            style: {
              'background-color': GRAPH_THEME.colors.arrayNode,
              shape: 'rectangle',
              width: '90px',
            },
          },
          {
            selector: 'node[type="LINKED_LIST"]',
            style: {
              'background-color': GRAPH_THEME.colors.linkedListNode,
              shape: 'round-rectangle',
            },
          },
          {
            selector: 'node[type="BINARY_TREE"]',
            style: {
              'background-color': GRAPH_THEME.colors.treeNode,
              shape: 'ellipse',
              width: '75px',
              height: '75px',
            },
          },
          {
            selector: 'node[type="STACK"]',
            style: {
              'background-color': GRAPH_THEME.colors.stackNode,
              shape: 'rectangle',
            },
          },
          {
            selector: 'node[type="QUEUE"]',
            style: {
              'background-color': GRAPH_THEME.colors.queueNode,
              shape: 'round-rectangle',
            },
          },
          {
            selector: 'node[type="STRING"]',
            style: {
              'background-color': GRAPH_THEME.colors.stringNode,
              shape: 'ellipse',
            },
          },
          {
            selector: 'node:selected',
            style: {
              'background-color': GRAPH_THEME.colors.selectedBg,
              'border-color': GRAPH_THEME.colors.selectedBorder,
              'border-width': GRAPH_THEME.dimensions.selectedBorderWidth,
              color: '#0f172a',
            },
          },
          {
            selector: 'edge',
            style: {
              width: GRAPH_THEME.dimensions.edgeWidth,
              'line-color': GRAPH_THEME.colors.edgeLine,
              'target-arrow-color': GRAPH_THEME.colors.edgeArrow,
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              'font-size': '10px',
              color: GRAPH_THEME.colors.edgeText,
              'text-background-opacity': 0.85,
              'text-background-color': GRAPH_THEME.colors.edgeBg,
              'text-background-padding': '2px 4px',
              'text-background-shape': 'roundrectangle',
            },
          },
        ],
      })

      cyRef.current = cy

      // Event listener: tap node updates selectedObjectId in Zustand store
      cy.on('tap', 'node', (evt) => {
        const node = evt.target
        setSelectedObjectId(node.id())
      })

      // Event listener: tap background clears selection
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedObjectId(null)
        }
      })
    } catch {
      // Fallback for non-canvas testing environments (JSDOM)
    }

    return () => {
      if (cy) {
        cy.destroy()
      }
      cyRef.current = null
    }
  }, [isConnected, setSelectedObjectId])

  // 3. Incremental Delta Differential Updates (Apply node/edge diffs using memoryLayoutEngine without resetting positions)
  useEffect(() => {
    const cy = cyRef.current
    if (!cy || !isConnected) return

    const targetNodeIds = new Set(nodes.map((n) => n.id))
    const targetEdgeIds = new Set(edges.map((e) => e.id))

    const runUpdates = () => {
      // 3a. Remove deleted nodes from Cytoscape and layout engine
      const existingNodes = typeof cy.nodes === 'function' ? cy.nodes() : null
      if (existingNodes && typeof existingNodes.forEach === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingNodes.forEach((existingNode: any) => {
          const id = typeof existingNode.id === 'function' ? existingNode.id() : existingNode.id
          if (id && !targetNodeIds.has(id)) {
            memoryLayoutEngine.removeObject(id)
            if (typeof cy.remove === 'function') cy.remove(existingNode)
          }
        })
      }

      // 3b. Remove deleted reference edges
      const existingEdges = typeof cy.edges === 'function' ? cy.edges() : null
      if (existingEdges && typeof existingEdges.forEach === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingEdges.forEach((existingEdge: any) => {
          const id = typeof existingEdge.id === 'function' ? existingEdge.id() : existingEdge.id
          if (id && !targetEdgeIds.has(id)) {
            if (typeof cy.remove === 'function') cy.remove(existingEdge)
          }
        })
      }

      // 3c. Add new heap object cards & update variable annotations on existing cards
      nodes.forEach((node, idx) => {
        const label = getNodeLabel(node)
        const existingNode = typeof cy.getElementById === 'function' ? cy.getElementById(node.id) : null

        if (existingNode && existingNode.length > 0) {
          // Update stack variable label annotation without moving card position!
          if (typeof existingNode.data === 'function') {
            if (existingNode.data('label') !== label) {
              existingNode.data('label', label)
            }
            if (existingNode.data('type') !== node.type) {
              existingNode.data('type', node.type)
            }
          }
        } else {
          // Calculate deterministic placement for newly allocated heap object card
          const parentEdge = edges.find((e) => e.target === node.id)
          const pos = memoryLayoutEngine.getPosition(
            node.id,
            parentEdge?.source,
            parentEdge?.fieldName,
            idx,
          )

          if (typeof cy.add === 'function') {
            cy.add({
              group: 'nodes',
              data: {
                id: node.id,
                label,
                type: node.type,
              },
              position: pos,
            })
          }
        }
      })

      // 3d. Add new reference edges between heap object cards
      edges.forEach((edge) => {
        const existingEdge = typeof cy.getElementById === 'function' ? cy.getElementById(edge.id) : null
        if (!existingEdge || existingEdge.length === 0) {
          const srcNode = typeof cy.getElementById === 'function' ? cy.getElementById(edge.source) : null
          const tgtNode = typeof cy.getElementById === 'function' ? cy.getElementById(edge.target) : null
          if (srcNode && srcNode.length > 0 && tgtNode && tgtNode.length > 0) {
            if (typeof cy.add === 'function') {
              cy.add({
                group: 'edges',
                data: {
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                  label: edge.fieldName,
                },
              })
            }
          }
        }
      })
    }

    if (typeof cy.batch === 'function') {
      cy.batch(runUpdates)
    } else {
      runUpdates()
    }

    // If initial load and nodes were added, run layout once
    if (typeof cy.nodes === 'function') {
      const allNodes = cy.nodes()
      if (allNodes && allNodes.length > 0 && typeof allNodes.some === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const needsInitLayout = allNodes.some((n: any) => {
          const p = typeof n.position === 'function' ? n.position() : null
          return p && p.x === 0 && p.y === 0
        })
        if (needsInitLayout) {
          handleResetLayout()
        }
      }
    }
  }, [nodes, edges, isConnected, getNodeLabel, handleResetLayout])

  // 4. Attach ResizeObserver for smooth automatic canvas resizing on window/pane resize
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (cyRef.current && typeof cyRef.current.resize === 'function') {
        cyRef.current.resize()
      }
    })

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [nodes])

  // 5. React to selectedObjectId changes with smooth centering animation
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    if (typeof cy.nodes === 'function') {
      const allNodes = cy.nodes()
      if (allNodes && typeof allNodes.unselect === 'function') {
        allNodes.unselect()
      }
    }

    if (selectedObjectId && typeof cy.getElementById === 'function') {
      const node = cy.getElementById(selectedObjectId)
      if (node && node.length > 0) {
        if (typeof node.select === 'function') node.select()
        if (typeof cy.animate === 'function') {
          cy.animate({
            center: { eles: node },
            zoom: 1.1,
            duration: 350,
          })
        } else if (typeof cy.center === 'function') {
          cy.center(node)
        }
      }
    }
  }, [selectedObjectId])

  const selectedObj =
    selectedObjectId && objects !== EMPTY_OBJECTS ? objects[selectedObjectId] : null
  const fields = selectedObj?.fieldsOrElements || {}
  const fieldKeys = Object.keys(fields)

  if (!isConnected || nodes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontStyle: 'italic',
        }}
        className="graph-empty"
      >
        No graph nodes available.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Legend & Search Toolbar Header */}
      <GraphLegend />
      <GraphSearchToolbar
        nodes={nodes}
        selectedObjectId={selectedObjectId}
        onSelectNode={(id) => setSelectedObjectId(id || null)}
        onResetLayout={handleResetLayout}
      />

      {/* Main Graph Viewport Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Cytoscape Canvas Viewport Container */}
        <div ref={containerRef} style={{ flex: 1, height: '100%', position: 'relative' }} />

        {/* Selected Node Inspector Details Panel */}
        <div
          tabIndex={0}
          aria-label="Object Inspector Details Panel"
          style={{
            width: '240px',
            backgroundColor: 'var(--bg-tertiary)',
            borderLeft: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
          className="graph-inspector"
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: 'bold',
              fontSize: '12px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            Object Inspector
          </div>

          {!selectedObj ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Select a node to inspect fields
            </div>
          ) : (
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Node Type and Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Class Type / ID
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: 'var(--accent-secondary)',
                  }}
                >
                  {selectedObj.classNameOrType}@{selectedObj.objectId}
                </span>
              </div>

              {/* Node Fields / Elements List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '10px',
                }}
              >
                <span
                  style={{ fontSize: '11px', color: 'var(--text-muted)', paddingBottom: '4px' }}
                >
                  Fields / Elements
                </span>
                {fieldKeys.length === 0 ? (
                  <span
                    style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)' }}
                  >
                    No fields
                  </span>
                ) : (
                  fieldKeys.map((key) => {
                    const val = fields[key]
                    const formatted = formatInspectorValue(
                      val.kind,
                      val.value ?? val.valueString ?? '',
                    )
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          borderBottom: '1px dashed var(--border-color)',
                          padding: '4px 0',
                        }}
                      >
                        <span
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                        >
                          {key}
                        </span>
                        <span
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
                        >
                          {formatted}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ObjectGraphPanel
