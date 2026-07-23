import React, { useMemo } from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'

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
 * First-Class Object Inspector Panel.
 * Displays details for the selected object including type, ID, fields, incoming references, and outgoing references.
 */
export const ObjectInspectorPanel: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

  const isConnected = connectionStatus === 'CONNECTED'
  const objects = isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : {}

  const selectedObj = selectedObjectId ? objects[selectedObjectId] : null

  // Calculate incoming and outgoing references
  const { incomingRefs, outgoingRefs } = useMemo(() => {
    if (!selectedObjectId || !objects) {
      return { incomingRefs: [], outgoingRefs: [] }
    }

    const incoming: { sourceId: string; sourceType: string; fieldName: string }[] = []
    const outgoing: { targetId: string; fieldName: string }[] = []

    Object.values(objects).forEach((obj) => {
      if (!obj || !obj.objectId) return
      const fields = obj.fieldsOrElements || {}

      Object.entries(fields).forEach(([fieldName, val]) => {
        if (!val) return
        const rawTargetId = val.objectId || (typeof val.value === 'string' ? val.value : val.valueString)
        if (!rawTargetId || rawTargetId === 'null') return
        const targetId = rawTargetId.replace(/^@/, '')

        // Check if outgoing from selected object
        if (obj.objectId === selectedObjectId && targetId) {
          outgoing.push({ targetId, fieldName })
        }

        // Check if incoming to selected object
        if (targetId === selectedObjectId && obj.objectId !== selectedObjectId) {
          incoming.push({
            sourceId: obj.objectId,
            sourceType: obj.classNameOrType,
            fieldName,
          })
        }
      })
    })

    return { incomingRefs: incoming, outgoingRefs: outgoing }
  }, [selectedObjectId, objects])

  if (!isConnected || !selectedObj) {
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
          padding: '24px',
          textAlign: 'center',
        }}
        className="inspector-empty"
      >
        Select an Object Card, Variable Reference, or Graph Node to inspect memory fields and relationships.
      </div>
    )
  }

  const fields = selectedObj.fieldsOrElements || {}
  const fieldKeys = Object.keys(fields)

  return (
    <div
      tabIndex={0}
      aria-label="Object Inspector Details View"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        overflowY: 'auto',
        padding: '12px',
        gap: '12px',
      }}
      className="object-inspector-panel"
    >
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
            Class Type & Reference ID
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--accent-secondary)',
            }}
          >
            {selectedObj.classNameOrType}@{selectedObj.objectId}
          </span>
        </div>

        <button
          onClick={() => setSelectedObjectId(null)}
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
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Incoming Refs: <strong style={{ color: 'var(--text-primary)' }}>{incomingRefs.length}</strong></span>
        <span>Outgoing Refs: <strong style={{ color: 'var(--text-primary)' }}>{outgoingRefs.length}</strong></span>
        <span>Fields Count: <strong style={{ color: 'var(--text-primary)' }}>{fieldKeys.length}</strong></span>
      </div>

      {/* Fields List Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Internal Fields & Elements
        </span>
        {fieldKeys.length === 0 ? (
          <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            No internal fields allocated.
          </span>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px' }}>Field / Index</th>
                <th style={{ padding: '4px 6px' }}>Kind</th>
                <th style={{ padding: '4px 6px' }}>Value / Target</th>
              </tr>
            </thead>
            <tbody>
              {fieldKeys.map((key) => {
                const val = fields[key]
                const formatted = formatInspectorValue(val.kind, val.value ?? val.valueString ?? '')
                return (
                  <tr key={key} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                    <td style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>{key}</td>
                    <td style={{ padding: '4px 6px', color: 'var(--text-secondary)', fontSize: '11px' }}>{val.kind}</td>
                    <td style={{ padding: '4px 6px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatted}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Incoming References Section */}
      {incomingRefs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>
            Incoming Pointers (Referenced By)
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {incomingRefs.map((ref, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedObjectId(ref.sourceId)}
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-secondary)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{ref.sourceType}@{ref.sourceId}</span>
                <span style={{ color: 'var(--text-muted)' }}>.{ref.fieldName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ObjectInspectorPanel
