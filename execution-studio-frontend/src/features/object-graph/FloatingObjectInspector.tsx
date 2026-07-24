import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView } from '@/types/visualization.types'
import { formatMemoryAddress } from '@/utils/formatMemoryAddress'

interface FloatingObjectInspectorProps {
  objectId: string | null
  onClose: () => void
}

/**
 * Execution Studio V4 — Object Inspector Panel.
 * Formatted like:
 *   OBJECT INSPECTOR
 *   Object: 0x2 (Node)
 *   ┌──────────┬──────────┐
 *   │ Field    │ Value    │
 *   ├──────────┼──────────┤
 *   │ data     │ 2        │
 *   │ next     │ 0x3      │
 *   └──────────┴──────────┘
 */
export const FloatingObjectInspector: React.FC<FloatingObjectInspectorProps> = ({
  objectId,
  onClose,
}) => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const isDeveloperMode = usePlaybackStore((state) => state.isDeveloperMode)

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
  const simpleName = simplifyClassName(selectedObj.classNameOrType)
  const hexAddress = formatMemoryAddress(selectedObj.objectId, isDeveloperMode)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '260px',
        backgroundColor: '#0f172a',
        border: '1.5px solid #38bdf8',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      className="floating-inspector-popover"
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          borderBottom: '1px solid #38bdf8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '11px',
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          OBJECT INSPECTOR
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          aria-label="Close inspector popover"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
          Object: {hexAddress} ({simpleName})
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '4px 6px', fontWeight: 'bold' }}>Field</th>
              <th style={{ padding: '4px 6px', fontWeight: 'bold' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {fieldKeys.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '6px', color: '#64748b', fontStyle: 'italic' }}>
                  (no fields)
                </td>
              </tr>
            ) : (
              fieldKeys.map((key) => {
                const val = fields[key]
                const isRef = val.kind === 'object_ref' || val.kind === 'array_ref' || !!val.objectId
                const displayVal = formatValue(val, isDeveloperMode)
                return (
                  <tr key={key} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '4px 6px', color: '#f8fafc' }}>{key}</td>
                    <td style={{ padding: '4px 6px', color: isRef ? '#c084fc' : '#38bdf8', fontWeight: 'bold' }}>
                      {displayVal}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatValue(val: any, isDevMode: boolean): string {
  if (!val) return '?'
  if (val.kind === 'null' || val.value === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? val.value ?? ''}"`
  if (val.kind === 'object_ref' || val.kind === 'array_ref' || val.objectId) {
    return formatMemoryAddress(val.objectId ?? val.valueString, isDevMode)
  }
  return String(val.valueString ?? val.value ?? '?')
}

function simplifyClassName(fullName: string): string {
  if (!fullName) return 'Object'
  const parts = fullName.split('.')
  return parts[parts.length - 1] ?? fullName
}

export default FloatingObjectInspector
