import React, { useMemo, useCallback } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import SourceViewerPanel from '@/features/source-viewer/SourceViewerPanel'
import { CallStackPanel } from '@/features/stack/CallStackPanel'
import { MemoryVisualizationCanvas } from '@/features/visualization/MemoryVisualizationCanvas'
import { ExplanationPanel } from '@/features/visualization/ExplanationPanel'
import { FloatingObjectInspector } from '@/features/object-graph/FloatingObjectInspector'
import { TimelinePanel } from '@/features/timeline/TimelinePanel'
import { generateExplanation } from '@/features/visualization/generateExplanation'
import type { HeapObjectView } from '@/types/visualization.types'

const EMPTY_OBJECTS: Record<string, HeapObjectView> = {}

// ── Resize Handle ─────────────────────────────────────────────────────────────
const ResizeHandle: React.FC<{ orientation?: 'horizontal' | 'vertical' }> = ({
  orientation = 'horizontal',
}) => (
  <Separator
    style={{
      width: orientation === 'horizontal' ? '5px' : '100%',
      height: orientation === 'vertical' ? '5px' : '100%',
      backgroundColor: 'var(--border-color)',
      cursor: orientation === 'horizontal' ? 'col-resize' : 'row-resize',
      transition: 'background-color 0.15s ease',
      flexShrink: 0,
    }}
    className="resizer-bar"
  />
)

// ── Panel Title Bar ───────────────────────────────────────────────────────────
const PanelTitle: React.FC<{ label: string; icon?: string; right?: React.ReactNode }> = ({
  label,
  icon,
  right,
}) => (
  <div
    style={{
      padding: '5px 10px',
      backgroundColor: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '11px',
      fontWeight: '700',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      flexShrink: 0,
      userSelect: 'none',
    }}
  >
    <span>
      {icon && <span style={{ marginRight: '5px' }}>{icon}</span>}
      {label}
    </span>
    {right}
  </div>
)

// ── Empty State ───────────────────────────────────────────────────────────────
const WelcomeState: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '16px',
      color: 'var(--text-muted)',
      padding: '24px',
    }}
  >
    <div style={{ fontSize: '48px' }}>☕</div>
    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
      Execution Studio
    </div>
    <div
      style={{
        fontSize: '12px',
        textAlign: 'center',
        maxWidth: '260px',
        lineHeight: '1.6',
        color: 'var(--text-muted)',
      }}
    >
      Write Java code in the editor, then click{' '}
      <strong style={{ color: 'var(--accent-success)' }}>▶ Run</strong> to visualize execution.
    </div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        maxWidth: '220px',
      }}
    >
      {['Stack frames and local variables', 'Heap objects and references', 'Arrays, linked lists, trees'].map((item) => (
        <div key={item} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          <span>✓</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
)

/**
 * Execution Studio V3 — Fixed Viewport Workspace.
 *
 * Layout:
 *   Left 65%: Java Source Editor
 *   Right 35%:
 *     Top: Call Stack (resizable) | Memory Visualization Canvas
 *     Bottom: Explanation Panel (fixed height)
 *   Bottom Bar: Playback Controls | Console Output
 *
 * The page NEVER scrolls. Only internal panels scroll.
 */
export const WorkspaceContainer: React.FC = () => {
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const previousModel = usePlaybackStore((state) => state.previousModel)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

  const isConnected = connectionStatus === 'CONNECTED'

  const objects = isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : EMPTY_OBJECTS
  const prevObjects = previousModel?.heap?.objects ?? EMPTY_OBJECTS
  const variables = currentModel?.variables?.variables ?? []

  const handleObjectClick = useCallback(
    (id: string) => {
      setSelectedObjectId(id === selectedObjectId ? null : id)
    },
    [selectedObjectId, setSelectedObjectId],
  )

  const explanation = useMemo(
    () => (isConnected ? generateExplanation(previousModel, currentModel) : ''),
    [isConnected, previousModel, currentModel],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        padding: '6px',
        gap: '6px',
        backgroundColor: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      {/* Floating Object Inspector Popover */}
      {selectedObjectId && (
        <FloatingObjectInspector
          objectId={selectedObjectId}
          onClose={() => setSelectedObjectId(null)}
        />
      )}

      {/* Main Resizable Panel Group */}
      <Group orientation="vertical" style={{ flex: 1, minHeight: 0 }}>
        {/* Top row: Editor | Visualization */}
        <Panel defaultSize={75} minSize={40}>
          <Group orientation="horizontal" style={{ height: '100%' }}>
            {/* ── Left: Java Source Editor ─────────────────────────────── */}
            <Panel defaultSize={62} minSize={25}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
                className="workspace-panel"
              >
                <SourceViewerPanel />
              </div>
            </Panel>

            <ResizeHandle orientation="horizontal" />

            {/* ── Right: Execution Visualization ───────────────────────── */}
            <Panel defaultSize={38} minSize={25}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                {!isConnected ? (
                  <WelcomeState />
                ) : (
                  <>
                    <Group orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>
                      {/* Call Stack sub-panel */}
                      <Panel defaultSize={34} minSize={20}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            borderRight: '1px solid var(--border-color)',
                          }}
                        >
                          <PanelTitle label="Call Stack" icon="🥞" />
                          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            <CallStackPanel />
                          </div>
                        </div>
                      </Panel>

                      <ResizeHandle orientation="horizontal" />

                      {/* Heap Memory Visualization sub-panel */}
                      <Panel defaultSize={66} minSize={30}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                          }}
                        >
                          <PanelTitle label="Heap Memory" icon="🧠" />
                          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <MemoryVisualizationCanvas
                              objects={objects}
                              prevObjects={prevObjects}
                              variables={variables}
                              selectedObjectId={selectedObjectId}
                              onObjectClick={handleObjectClick}
                            />
                          </div>
                        </div>
                      </Panel>
                    </Group>

                    {/* Explanation Panel — fixed height strip at bottom of right pane */}
                    <ExplanationPanel text={explanation} />
                  </>
                )}
              </div>
            </Panel>
          </Group>
        </Panel>

        <ResizeHandle orientation="vertical" />

        {/* Bottom row: Playback Controls | Console */}
        <Panel defaultSize={25} minSize={12}>
          <Group orientation="horizontal" style={{ height: '100%' }}>
            {/* Playback Controls */}
            <Panel defaultSize={55} minSize={30}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <PanelTitle label="Playback Controls" icon="⏯" />
                <div
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <TimelinePanel />
                </div>
              </div>
            </Panel>

            <ResizeHandle orientation="horizontal" />

            {/* Console Output */}
            <Panel defaultSize={45} minSize={20}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <ConsoleOutput />
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  )
}

// ── Inline Console Output ─────────────────────────────────────────────────────

const ConsoleOutput: React.FC = () => {
  const connectionStatus = usePlaybackStore((s) => s.connectionStatus)
  const currentModel = usePlaybackStore((s) => s.currentModel)
  const error = usePlaybackStore((s) => s.error)
  const isConnected = connectionStatus === 'CONNECTED'

  const currentLine = currentModel?.highlights?.currentLine ?? 0
  const currentMethod = currentModel?.highlights?.currentMethod ?? ''
  const status = currentModel?.status ?? null

  return (
    <>
      <PanelTitle
        label="Console"
        icon="💻"
        right={
          isConnected ? (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                backgroundColor:
                  status === 'COMPLETED'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : status === 'EXCEPTION'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(56, 189, 248, 0.12)',
                color:
                  status === 'COMPLETED'
                    ? 'var(--accent-success)'
                    : status === 'EXCEPTION'
                      ? 'var(--accent-error)'
                      : 'var(--accent-secondary)',
                fontWeight: 'bold',
              }}
            >
              {status ?? 'IDLE'}
            </span>
          ) : null
        }
      />
      <div
        style={{
          flex: 1,
          padding: '8px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          backgroundColor: '#090d16',
          color: '#f8fafc',
        }}
      >
        {error && (
          <div style={{ color: 'var(--accent-error)' }}>⚠ {error}</div>
        )}
        {!isConnected ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Console idle. Click ▶ Run to execute Java code.
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--accent-success)' }}>
              [JVM] Trace loaded successfully.
            </div>
            {currentMethod && (
              <div style={{ color: '#f8fafc' }}>
                {currentMethod}() : line {currentLine}
              </div>
            )}
            {status === 'EXCEPTION' && (
              <div style={{ color: 'var(--accent-error)' }}>
                ⚠ Runtime exception occurred.
              </div>
            )}
            {status === 'COMPLETED' && (
              <div style={{ color: 'var(--accent-success)' }}>
                ✓ Program completed normally.
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default WorkspaceContainer
