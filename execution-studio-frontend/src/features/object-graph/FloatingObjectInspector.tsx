import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView } from '@/types/visualization.types'

interface FloatingObjectInspectorProps {
  objectId: string | null
  onClose: () => void
}

/**
 * Formats display values inside the floating inspector.
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
 * Lightweight Floating Popover Object Inspector.
 * Opens on object selection without permanently reserving workspace layout space.
 */
export const FloatingObjectInspector: React.FC<FloatingObjectInspectorProps> = ({
  objectId,
  onClose,
}) => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)

  const selectedObj: HeapObjectView | undefined =
    objectId && currentModel?.heap?.objects ? currentModel.heap.objects[objectId] : undefined

  React.useEffect(() => {
    if (objectId && !selectedObj) {
      onClose()
    }
  }, [objectId, selectedObj, onClose])

  if (!objectId || connectionStatus !== 'CONNECTED' || !selectedObj) {
    return null
  }

  const fields = selectedObj.fieldsOrElements || {}
  const fieldKeys = Object.keys(fields)

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '260px',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-md)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      className="floating-inspector-popover"
    >
      {/* Popover Header */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-primary)' }}>
          🔍 Object Inspector
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          aria-label="Close inspector popover"
        >
          ✕
        </button>
      </div>

      {/* Popover Content Body */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Class Type & ID</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--accent-secondary)',
            }}
          >
            {selectedObj.classNameOrType}@{selectedObj.objectId}
          </span>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Fields / Elements ({fieldKeys.length})
          </span>
          {fieldKeys.length === 0 ? (
            <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              No internal fields
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
                    fontSize: '11px',
                    padding: '3px 0',
                    borderBottom: '1px dashed var(--border-color)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {key}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {formatted}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default FloatingObjectInspector
