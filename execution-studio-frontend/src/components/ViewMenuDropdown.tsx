import React, { useState, useRef, useEffect } from 'react'
import { useLayoutStore, type PanelId, type LayoutPreset } from '@/store/useLayoutStore'

/**
 * VS Code-style View Menu and Preset Dropdown Component.
 * Enables toggling individual workspace panels and selecting preset layouts.
 */
export const ViewMenuDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const preset = useLayoutStore((state) => state.preset)
  const setPreset = useLayoutStore((state) => state.setPreset)
  const panelVisibilities = useLayoutStore((state) => state.panelVisibilities)
  const togglePanelVisibility = useLayoutStore((state) => state.togglePanelVisibility)
  const resetLayout = useLayoutStore((state) => state.resetLayout)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const panelsList: { id: PanelId; label: string }[] = [
    { id: 'editor', label: 'Java Source Editor' },
    { id: 'graph', label: 'Object Reference Graph' },
    { id: 'variables', label: 'Local Variables Table' },
    { id: 'heap', label: 'Heap Memory Cards' },
    { id: 'stack', label: 'Call Stack' },
    { id: 'inspector', label: 'Object Inspector' },
    { id: 'events', label: 'Execution Event Log' },
    { id: 'timeline', label: 'Timeline Player' },
  ]

  const presetsList: { id: LayoutPreset; label: string }[] = [
    { id: 'learning', label: '🎓 Learning Mode (Default)' },
    { id: 'debug', label: '🐞 Debug Mode' },
    { id: 'memory', label: '🧠 Memory Mode' },
    { id: 'presentation', label: '📽 Presentation Mode' },
    { id: 'compact', label: '💻 Compact Mode' },
  ]

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        aria-label="View Menu & Presets Dropdown"
      >
        <span>View & Layout</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            width: '240px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            padding: '8px 0',
            fontSize: '12px',
          }}
        >
          {/* Section 1: Presets */}
          <div style={{ padding: '4px 12px', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
            Workspace Presets
          </div>
          {presetsList.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setPreset(p.id)
                setIsOpen(false)
              }}
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                backgroundColor: preset === p.id ? 'var(--bg-tertiary)' : 'transparent',
                color: preset === p.id ? 'var(--accent-secondary)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{p.label}</span>
              {preset === p.id && <span>✓</span>}
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '6px 0' }} />

          {/* Section 2: Panel Visibility Checkboxes */}
          <div style={{ padding: '4px 12px', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
            Panel Visibilities
          </div>
          {panelsList.map((panel) => {
            const isVisible = panelVisibilities[panel.id] ?? true
            return (
              <div
                key={panel.id}
                onClick={() => togglePanelVisibility(panel.id)}
                style={{
                  padding: '5px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => {}}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent-secondary)' }}
                />
                <span>{panel.label}</span>
              </div>
            )
          })}

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '6px 0' }} />

          {/* Section 3: Reset Action */}
          <div
            onClick={() => {
              resetLayout()
              setIsOpen(false)
            }}
            style={{
              padding: '6px 16px',
              cursor: 'pointer',
              color: 'var(--accent-error)',
              fontWeight: 'bold',
            }}
          >
            ↺ Reset Layout to Defaults
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewMenuDropdown
