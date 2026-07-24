import React, { useMemo, useCallback, useRef } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import SourceViewerPanel from '@/features/source-viewer/SourceViewerPanel'
import { CallStackPanel } from '@/features/stack/CallStackPanel'
import { MemoryVisualizationCanvas } from '@/features/visualization/MemoryVisualizationCanvas'
import { ExplanationPanel } from '@/features/visualization/ExplanationPanel'
import { FloatingObjectInspector } from '@/features/object-graph/FloatingObjectInspector'
import { TimelinePanel } from '@/features/timeline/TimelinePanel'
import { ReferencePointerOverlay } from '@/features/visualization/ReferencePointerOverlay'
import { generateExplanation } from '@/features/visualization/generateExplanation'
import { ConsolePanel } from './ConsolePanel'
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
      padding: '6px 12px',
      backgroundColor: '#0f172a',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '11px',
      fontWeight: '700',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      flexShrink: 0,
      userSelect: 'none',
    }}
  >
    <span>
      {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}
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
    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>
      Execution Studio V4
    </div>
    <div
      style={{
        fontSize: '12px',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: '1.6',
        color: '#94a3b8',
      }}
    >
      Write Java code in the editor, then click{' '}
      <strong style={{ color: '#22c55e' }}>▶ Run</strong> to simulate execution memory.
    </div>
  </div>
)

/**
 * Execution Studio V4 — Educational Execution Simulator Layout.
 */
export const WorkspaceContainer: React.FC = () => {
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const previousModel = usePlaybackStore((state) => state.previousModel)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)
  const currentStep = usePlaybackStore((state) => state.currentStep)

  const vizContainerRef = useRef<HTMLDivElement | null>(null)

  const isConnected = connectionStatus === 'CONNECTED'

  const objects = isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : EMPTY_OBJECTS
  const prevObjects = previousModel?.heap?.objects ?? EMPTY_OBJECTS
  const variables = currentModel?.variables?.variables ?? []
  const frames = isConnected && currentModel?.stack ? currentModel.stack.frames : []

  const handleObjectClick = useCallback(
    (id: string) => {
      setSelectedObjectId(id === selectedObjectId ? null : id)
    },
    [selectedObjectId, setSelectedObjectId],
  )

  const explanation = useMemo(
    () => (isConnected ? generateExplanation(previousModel, currentModel, currentStep) : ''),
    [isConnected, previousModel, currentModel, currentStep],
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
        backgroundColor: '#090d16',
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
        {/* Top row: Code Editor | Execution Visualization */}
        <Panel defaultSize={76} minSize={40}>
          <Group orientation="horizontal" style={{ height: '100%' }}>
            {/* ── Left: Java Source Editor ─────────────────────────────── */}
            <Panel defaultSize={45} minSize={25}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
                className="workspace-panel"
              >
                <SourceViewerPanel />
              </div>
            </Panel>

            <ResizeHandle orientation="horizontal" />

            {/* ── Right: Execution Visualization ───────────────────────── */}
            <Panel defaultSize={55} minSize={30}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <PanelTitle label="EXECUTION VISUALIZATION" icon="⚙️" />

                {!isConnected ? (
                  <WelcomeState />
                ) : (
                  <>
                    {/* SVG Pointer Overlay Container */}
                    <div
                      ref={vizContainerRef}
                      style={{
                        flex: 1,
                        display: 'flex',
                        minHeight: 0,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <ReferencePointerOverlay
                        frames={frames}
                        objects={objects}
                        containerRef={vizContainerRef}
                      />

                      <Group orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>
                        {/* Call Stack Sub-panel */}
                        <Panel defaultSize={35} minSize={20}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              borderRight: '1px solid var(--border-color)',
                              backgroundColor: '#0b1120',
                            }}
                          >
                            <PanelTitle label="CALL STACK" icon="🥞" />
                            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                              <CallStackPanel />
                            </div>
                          </div>
                        </Panel>

                        <ResizeHandle orientation="horizontal" />

                        {/* Heap Memory Sub-panel */}
                        <Panel defaultSize={65} minSize={30}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              backgroundColor: '#0b1120',
                            }}
                          >
                            <PanelTitle label="HEAP (OBJECTS)" icon="🧠" />
                            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                    </div>

                    {/* Explanation Panel at bottom of Visualization */}
                    <ExplanationPanel text={explanation} />
                  </>
                )}
              </div>
            </Panel>
          </Group>
        </Panel>

        <ResizeHandle orientation="vertical" />

        {/* Bottom row: Playback Controls | Console Output */}
        <Panel defaultSize={24} minSize={12}>
          <Group orientation="horizontal" style={{ height: '100%' }}>
            {/* Playback Controls */}
            <Panel defaultSize={50} minSize={30}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <PanelTitle label="PLAYBACK CONTROLS" icon="⏯" />
                <div
                  style={{
                    flex: 1,
                    padding: '8px 12px',
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
            <Panel defaultSize={50} minSize={20}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
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
  const isConnected = connectionStatus === 'CONNECTED'
  const status = currentModel?.status ?? null

  return (
    <>
      <PanelTitle
        label="CONSOLE OUTPUT"
        icon="💻"
        right={
          isConnected ? (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor:
                  status === 'COMPLETED'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : status === 'EXCEPTION'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(56, 189, 248, 0.12)',
                color:
                  status === 'COMPLETED'
                    ? '#22c55e'
                    : status === 'EXCEPTION'
                      ? '#ef4444'
                      : '#38bdf8',
                fontWeight: 'bold',
              }}
            >
              {status ?? 'IDLE'}
            </span>
          ) : null
        }
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ConsolePanel />
      </div>
    </>
  )
}

export default WorkspaceContainer
