import React, { useRef, useEffect, useMemo } from 'react'
import cytoscape from 'cytoscape'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView } from '@/types/visualization.types'
import GraphBuilder from './GraphBuilder'
import GraphLegend from './GraphLegend'
import GraphSearchToolbar from './GraphSearchToolbar'
import GRAPH_THEME from './graph.theme'

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
 * Object Graph Panel component using Cytoscape.js.
 * Renders nodes (objects, arrays, strings) and edges (reference fields, array indices).
 * Provides interactive node selection, smooth centering animation, search toolbar, and side inspector.
 */
export const ObjectGraphPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

  const isConnected = connectionStatus === 'CONNECTED'

  // Read heap objects from active playback model
  const objects =
    isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : EMPTY_OBJECTS

  // 1. Build generic GraphModel using GraphBuilder
  const { nodes, edges } = useMemo(() => {
    return GraphBuilder.build(objects)
  }, [objects])

  // 2. Initialize Cytoscape canvas instance whenever nodes/edges change
  useEffect(() => {
    if (!containerRef.current || !isConnected || nodes.length === 0) return

    // Transform generic GraphModel elements into Cytoscape element definitions
    const cyElements: cytoscape.ElementDefinition[] = []

    // Add nodes
    nodes.forEach((node) => {
      cyElements.push({
        data: {
          id: node.id,
          label: `${node.classNameOrType}\n@${node.objectId}`,
          type: node.type,
        },
      })
    })

    // Add edges
    edges.forEach((edge) => {
      cyElements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.fieldName,
        },
      })
    })

    // Instantiate Cytoscape Core instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
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
            width: GRAPH_THEME.dimensions.nodeSize,
            height: GRAPH_THEME.dimensions.nodeSize,
            'border-width': GRAPH_THEME.dimensions.borderWidth,
            'border-color': GRAPH_THEME.colors.nodeBorder,
          },
        },
        {
          selector: 'node[type="ARRAY"]',
          style: {
            'background-color': GRAPH_THEME.colors.arrayNode,
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
      layout: {
        name: 'cose',
        animate: false,
        refresh: 20,
        fit: true,
        padding: 35,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 120,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
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

    // Pre-select active selected node if set
    if (selectedObjectId) {
      const node = cy.getElementById(selectedObjectId)
      if (node && node.length > 0) {
        node.select()
      }
    }

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [nodes, edges, isConnected, setSelectedObjectId])

  // 3. Attach ResizeObserver for smooth automatic canvas resizing on window/pane resize
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize()
      }
    })

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [nodes])

  // 4. React to selectedObjectId changes with smooth centering animation
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.nodes().unselect()
    if (selectedObjectId) {
      const node = cy.getElementById(selectedObjectId)
      if (node && node.length > 0) {
        node.select()
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
