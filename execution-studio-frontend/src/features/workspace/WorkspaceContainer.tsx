import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react'
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
import { calculateVerticalWorkspaceResize } from './verticalResizeMath'
import type { HeapObjectView } from '@/types/visualization.types'

const EMPTY_OBJECTS: Record<string, HeapObjectView> = {}

// ── Horizontal Resize Handle ──────────────────────────────────────────────────
const ResizeHandle: React.FC = () => (
  <Separator
    style={{
      width: '5px',
      height: '100%',
      backgroundColor: 'var(--border-color)',
      cursor: 'col-resize',
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
 * Execution Studio V5 — Unconstrained Vertical Workspace Workbench Layout.
 *
 * Top | Bottom vertical split uses explicit pixel state & Pointer Capture.
 * TOP workspace can grow arbitrarily large (e.g. 1000px, 1500px+) without an upper cap.
 * Bottom workspace is preserved at minimum 150px during downward expansion.
 * Document page scrolls naturally when workspace height exceeds viewport height.
 */
export const WorkspaceContainer: React.FC = () => {
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const previousModel = usePlaybackStore((state) => state.previousModel)
  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)
  const currentStep = usePlaybackStore((state) => state.currentStep)

  // Explicit pixel heights for Top and Bottom regions
  const [topHeight, setTopHeight] = useState<number>(500)
  const [bottomHeight, setBottomHeight] = useState<number>(180)
  const [isDraggingVertical, setIsDraggingVertical] = useState<boolean>(false)

  const dragStartRef = useRef<{
    top: number
    bottom: number
    startY: number
    pointerId: number
  } | null>(null)

  const vizContainerRef = useRef<HTMLDivElement | null>(null)

  const isConnected = connectionStatus === 'CONNECTED'

  const objects = isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : EMPTY_OBJECTS
  const prevObjects = previousModel?.heap?.objects ?? EMPTY_OBJECTS
  const variables = currentModel?.variables?.variables ?? []
  const frames = isConnected && currentModel?.stack ? currentModel.stack.frames : []

  const getAvailableWorkspaceHeight = useCallback(() => {
    const headerEl = document.querySelector('.app-header')
    const footerEl = document.querySelector('.app-footer')
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 44
    const footerH = footerEl ? footerEl.getBoundingClientRect().height : 24
    return Math.max(455, Math.round(window.innerHeight - headerH - footerH - 12))
  }, [])

  // Maintain baseline viewport height on mount and window resize
  useEffect(() => {
    const updateBaseline = () => {
      if (dragStartRef.current || isDraggingVertical) return
      const available = getAvailableWorkspaceHeight()
      const newBottom = Math.max(150, Math.round(available * 0.27))
      const newTop = Math.max(300, available - 5 - newBottom)
      setTopHeight((prevTop) => {
        setBottomHeight((prevBottom) => {
          const currentTotal = prevTop + 5 + prevBottom
          if (currentTotal <= available + 10) {
            return newBottom
          }
          return prevBottom
        })
        const currentTotal = prevTop + 5 + bottomHeight
        if (currentTotal <= available + 10) {
          return newTop
        }
        return prevTop
      })
    }

    updateBaseline()
    window.addEventListener('resize', updateBaseline)
    return () => window.removeEventListener('resize', updateBaseline)
  }, [getAvailableWorkspaceHeight, isDraggingVertical, bottomHeight])

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

  // Trigger geometry recalculation in ReferencePointerOverlay during panel drag
  const handleLayoutChange = useCallback(() => {
    window.dispatchEvent(new Event('resize'))
  }, [])

  // ── Vertical Workspace Handle Drag (Pointer Capture) ──────────────────────
  const handleVerticalPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const handleEl = e.currentTarget
    handleEl.setPointerCapture(e.pointerId)
    setIsDraggingVertical(true)
    dragStartRef.current = {
      top: topHeight,
      bottom: bottomHeight,
      startY: e.clientY,
      pointerId: e.pointerId,
    }
  }, [topHeight, bottomHeight])

  const handleVerticalPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !isDraggingVertical) return
    const deltaY = e.clientY - dragStartRef.current.startY
    const available = getAvailableWorkspaceHeight()

    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: dragStartRef.current.top,
      dragStartBottomHeight: dragStartRef.current.bottom,
      deltaY,
      availableWorkspaceHeight: available,
    })

    setTopHeight(res.topHeight)
    setBottomHeight(res.bottomHeight)
    window.dispatchEvent(new Event('resize'))
  }, [isDraggingVertical, getAvailableWorkspaceHeight])

  const handleVerticalPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      try {
        e.currentTarget.releasePointerCapture(dragStartRef.current.pointerId)
      } catch (_) {}
    }
    dragStartRef.current = null
    setIsDraggingVertical(false)
    window.dispatchEvent(new Event('resize'))
  }, [])

  return (
    /*
     * Workspace Layout — Real Height Content-Driven Workbench Model
     * ────────────────────────────────────────────────────────────────────────
     * Page (body / html: min-height: 100vh, overflow-y: auto)
     *   Header (flex-shrink: 0, 44px)
     *   WorkspaceContainer (height: auto, min-height: 455px, overflow: visible)
     *     #workspace-top (height: `${topHeight}px`, flex-shrink: 0, min-height: 300px)
     *       Horizontal Group: Editor | Visualization
     *     VerticalWorkspaceResizeHandle (5px separator, pointer capture)
     *     #workspace-bottom (height: `${bottomHeight}px`, flex-shrink: 0, min-height: 150px)
     *       Horizontal Group: Playback | Console
     *   Footer (flex-shrink: 0, 24px)
     * ────────────────────────────────────────────────────────────────────────
     */
    <div
      className="workspace-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: '455px',
        width: '100%',
        minWidth: 0,
        padding: '6px',
        gap: '0',
        backgroundColor: '#090d16',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Floating Object Inspector Popover */}
      {selectedObjectId && (
        <FloatingObjectInspector
          objectId={selectedObjectId}
          onClose={() => setSelectedObjectId(null)}
        />
      )}

      {/* ── TOP WORKSPACE: Code Editor | Execution Visualization ──────────── */}
      <div
        id="workspace-top"
        style={{
          height: `${topHeight}px`,
          flexShrink: 0,
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Group
          orientation="horizontal"
          onLayoutChange={handleLayoutChange}
          style={{ height: '100%' }}
          id="workspace-top-group"
        >
          {/* ── Left: Java Source Editor ───────────────────────────── */}
          <Panel minSize={280} defaultSize="42%" id="panel-editor">
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

          <ResizeHandle />

          {/* ── Right: Execution Visualization ─────────────────────── */}
          <Panel minSize={380} defaultSize="58%" id="panel-viz">
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

                    {/* Call Stack | Heap horizontal split */}
                    <Group
                      orientation="horizontal"
                      onLayoutChange={handleLayoutChange}
                      style={{ flex: 1, minHeight: 0 }}
                      id="workspace-viz-group"
                    >
                      {/* Call Stack Sub-panel */}
                      <Panel minSize={160} defaultSize="35%" id="panel-callstack">
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

                      <ResizeHandle />

                      {/* Heap Memory Sub-panel */}
                      <Panel minSize={200} defaultSize="65%" id="panel-heap">
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

                  <ExplanationPanel text={explanation} />
                </>
              )}
            </div>
          </Panel>
        </Group>
      </div>

      {/* ── VERTICAL WORKSPACE RESIZE HANDLE (Pointer Capture) ────────────── */}
      <div
        onPointerDown={handleVerticalPointerDown}
        onPointerMove={handleVerticalPointerMove}
        onPointerUp={handleVerticalPointerUp}
        onPointerCancel={handleVerticalPointerUp}
        style={{
          height: '5px',
          width: '100%',
          backgroundColor: isDraggingVertical ? 'var(--accent-color)' : 'var(--border-color)',
          cursor: 'row-resize',
          flexShrink: 0,
          userSelect: 'none',
          touchAction: 'none',
          transition: isDraggingVertical ? 'none' : 'background-color 0.15s ease',
          zIndex: 30,
        }}
        className="resizer-bar vertical-workspace-resizer"
      />

      {/* ── BOTTOM WORKSPACE: Playback Controls | Console Output ─────────── */}
      <div
        id="workspace-bottom"
        style={{
          height: `${bottomHeight}px`,
          flexShrink: 0,
          minHeight: '150px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Group
          orientation="horizontal"
          onLayoutChange={handleLayoutChange}
          style={{ height: '100%' }}
          id="workspace-bottom-group"
        >
          {/* Playback Controls */}
          <Panel minSize={260} defaultSize="50%" id="panel-playback">
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

          <ResizeHandle />

          {/* Console Output */}
          <Panel minSize={200} defaultSize="50%" id="panel-console">
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
      </div>
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
