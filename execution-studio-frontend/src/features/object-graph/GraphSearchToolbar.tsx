import React, { useState, useMemo } from 'react'
import type { GraphNode } from './GraphNode'

interface GraphSearchToolbarProps {
  nodes: GraphNode[]
  selectedObjectId: string | null
  onSelectNode: (objectId: string) => void
}

/**
 * Search toolbar allowing searching heap nodes by Object ID or Class Type.
 */
export const GraphSearchToolbar: React.FC<GraphSearchToolbarProps> = ({
  nodes,
  selectedObjectId,
  onSelectNode,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.toLowerCase().trim()
    return nodes.filter(
      (node) =>
        node.objectId.toLowerCase().includes(term) ||
        node.classNameOrType.toLowerCase().includes(term) ||
        node.id.toLowerCase().includes(term),
    )
  }, [nodes, searchTerm])

  const handleSelect = (objectId: string) => {
    onSelectNode(objectId)
    setSearchTerm('')
    setIsOpen(false)
  }

  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="🔍 Search node by ID or Type (e.g. Student, obj_1)..."
          aria-label="Search heap nodes"
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
          }}
        />

        {isOpen && filteredNodes.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => handleSelect(node.id)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  backgroundColor:
                    selectedObjectId === node.id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {node.classNameOrType}
                </span>
                <span style={{ color: 'var(--accent-secondary)' }}>@{node.objectId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedObjectId && (
        <button
          onClick={() => onSelectNode('')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '11px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Clear Selection
        </button>
      )}
    </div>
  )
}

export default GraphSearchToolbar
