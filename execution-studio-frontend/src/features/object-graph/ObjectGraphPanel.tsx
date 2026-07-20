import React, { useRef, useEffect, useMemo } from 'react'
import cytoscape from 'cytoscape'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView } from '@/types/visualization.types'
import GraphBuilder from './GraphBuilder'
import GraphLegend from './GraphLegend'

const EMPTY_OBJECTS = {}

/**
 * Formats values inside the side inspector panel.
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
 * Renders nodes (objects) and edges (references) with a dynamic side inspector.
 */
export const ObjectGraphPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

  const isConnected = connectionStatus === 'CONNECTED'

  // Wrap inside static reference fallback to avoid hook dependency triggers
  const objects =
    isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : EMPTY_OBJECTS

  // 1. Build nodes and edges using GraphBuilder
  const { nodes, edges } = useMemo(() => {
    return GraphBuilder.build(objects)
  }, [objects])

  // 2. Initialize Cytoscape canvas instance on nodes/edges change
  useEffect(() => {
    if (!containerRef.current || !isConnected) return

    // Transform elements into Cytoscape format
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

    // Instantiate Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#a855f7', // accent-color (neon violet)
            label: 'data(label)',
            color: '#f8fafc', // text-primary
            'font-size': '11px',
            'font-family': 'var(--font-sans)',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            width: '64px',
            height: '64px',
            'border-width': '2px',
            'border-color': '#334155', // border-color
          },
        },
        {
          selector: 'node[type="ARRAY"]',
          style: {
            'background-color': '#0ea5e9', // Array node cyan
            shape: 'round-rectangle',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#e9d5ff', // selected state highlight
            'border-color': '#a855f7',
            'border-width': '4px',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '10px',
            color: '#94a3b8', // text-muted
            'text-background-opacity': 0.8,
            'text-background-color': '#0f172a', // background dark shade
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        refresh: 20,
        fit: true,
        padding: 30,
        nodeRepulsion: () => 4500,
        idealEdgeLength: () => 100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })

    cyRef.current = cy

    // Event listener: node selection updates details panel in global store
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

    // Pre-select active selected node if set originally
    if (selectedObjectId) {
      const node = cy.getElementById(selectedObjectId)
      if (node.length > 0) {
        node.select()
      }
    }

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [nodes, edges, isConnected, selectedObjectId, setSelectedObjectId])

  // 3. React to selection adjustments without rebuilds
  useEffect(() => {
    const cy = cyRef.current
    if (cy) {
      cy.nodes().unselect()
      if (selectedObjectId) {
        const node = cy.getElementById(selectedObjectId)
        if (node.length > 0) {
          node.select()
        }
      }
    }
  }, [selectedObjectId])

  const selectedObj =
    selectedObjectId && objects !== EMPTY_OBJECTS
      ? (objects as Record<string, HeapObjectView>)[selectedObjectId]
      : null
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
      {/* Legend Header */}
      <GraphLegend />

      {/* Main Graph Viewport Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas viewport container */}
        <div ref={containerRef} style={{ flex: 1, height: '100%', position: 'relative' }} />

        {/* Selected Node Details side-inspector */}
        <div
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
              {/* Node Address Details */}
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

              {/* Node Fields Details List */}
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
                  Fields
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
