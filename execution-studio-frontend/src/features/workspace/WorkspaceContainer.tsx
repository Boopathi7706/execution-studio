import React from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { useLayoutStore, type DockTabId } from '@/store/useLayoutStore'
import { Card } from '@/components/Card'
import SourceViewerPanel from '@/features/source-viewer/SourceViewerPanel'
import ObjectGraphPanel from '@/features/object-graph/ObjectGraphPanel'
import ExecutionOverview from '@/features/workspace/ExecutionOverview'
import CallStackPanel from '@/features/stack/CallStackPanel'
import VariablesPanel from '@/features/variables/VariablesPanel'
import HeapViewContainer from '@/features/heap/HeapViewContainer'
import ObjectInspectorPanel from '@/features/object-graph/ObjectInspectorPanel'
import ExecutionEventLogPanel from '@/features/timeline/ExecutionEventLogPanel'
import TimelinePanel from '@/features/timeline/TimelinePanel'

/**
 * Resizable Splitter Handle Component using react-resizable-panels Separator.
 */
const ResizeHandle: React.FC<{ orientation?: 'horizontal' | 'vertical' }> = ({
  orientation = 'horizontal',
}) => (
  <Separator
    style={{
      width: orientation === 'horizontal' ? '6px' : '100%',
      height: orientation === 'vertical' ? '6px' : '100%',
      backgroundColor: 'var(--border-color)',
      cursor: orientation === 'horizontal' ? 'col-resize' : 'row-resize',
      transition: 'background-color var(--transition-fast)',
      position: 'relative',
      zIndex: 10,
    }}
    className="resizer-bar"
  />
)

/**
 * Execution Studio Version 2.0 Dockable IDE Workspace Container.
 * State-Aware Architecture:
 * - BEFORE EXECUTION: Renders Source Editor (Left) & Execution Overview (Right).
 * - AFTER TRACE LOADED: Renders Source Editor (Left) & Object Reference Graph (Right - ALWAYS VISIBLE!).
 * - BOTTOM DOCK: Resizable tabbed dock switching between Variables, Heap Cards, Call Stack, Inspector, and Event Log.
 * - BOTTOM BAR: Full-width Timeline player bar.
 */
export const WorkspaceContainer: React.FC = () => {
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const isTraceLoaded = connectionStatus === 'CONNECTED'

  const activeDockTab = useLayoutStore((state) => state.activeDockTab)
  const setActiveDockTab = useLayoutStore((state) => state.setActiveDockTab)
  const panelVisibilities = useLayoutStore((state) => state.panelVisibilities)

  const isEditorVisible = panelVisibilities.editor ?? true
  const isGraphVisible = panelVisibilities.graph ?? true
  const isTimelineVisible = panelVisibilities.timeline ?? true

  const dockTabs: { id: DockTabId; label: string }[] = [
    { id: 'variables', label: 'Local Variables' },
    { id: 'heap', label: 'Heap Memory Cards' },
    { id: 'stack', label: 'Call Stack' },
    { id: 'inspector', label: 'Object Inspector' },
    { id: 'events', label: 'Execution Event Log' },
  ]

  const renderActiveDockContent = () => {
    switch (activeDockTab) {
      case 'variables':
        return <VariablesPanel />
      case 'heap':
        return <HeapViewContainer />
      case 'stack':
        return <CallStackPanel />
      case 'inspector':
        return <ObjectInspectorPanel />
      case 'events':
        return <ExecutionEventLogPanel />
      default:
        return <VariablesPanel />
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        padding: '8px',
        gap: '8px',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Vertical Panel Group: Main Viewport (Top) & Inspection Dock (Bottom) */}
      <Group orientation="vertical" style={{ height: '100%', width: '100%' }}>
        {/* Top Main Viewport Panel */}
        <Panel defaultSize={65} minSize={30}>
          <Group orientation="horizontal" style={{ height: '100%', width: '100%' }}>
            {/* Left Column: Java Source Editor */}
            {isEditorVisible && (
              <Panel defaultSize={50} minSize={25}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                  className="workspace-panel"
                >
                  <div className="panel-header">
                    <span>Java Source Code Editor</span>
                  </div>
                  <div className="panel-body" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
                    <SourceViewerPanel />
                  </div>
                </div>
              </Panel>
            )}

            {isEditorVisible && isGraphVisible && <ResizeHandle orientation="horizontal" />}

            {/* Right Column: State-Aware Viewport (Execution Overview or Object Graph) */}
            {isGraphVisible && (
              <Panel defaultSize={50} minSize={25}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                  className="workspace-panel"
                >
                  <div className="panel-header">
                    <span>
                      {isTraceLoaded
                        ? 'Interactive Object Reference Graph'
                        : 'Execution Studio Landing Overview'}
                    </span>
                  </div>
                  <div className="panel-body" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
                    {isTraceLoaded ? <ObjectGraphPanel /> : <ExecutionOverview />}
                  </div>
                </div>
              </Panel>
            )}
          </Group>
        </Panel>

        <ResizeHandle orientation="vertical" />

        {/* Bottom Resizable Inspection Dock */}
        <Panel defaultSize={35} minSize={15}>
          <Card title="Workspace Inspection Dock">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              {/* Tab Header Bar */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border-color)',
                  overflowX: 'auto',
                }}
              >
                {dockTabs.map((tab) => {
                  const isActive = activeDockTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDockTab(tab.id)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                        color: isActive ? 'var(--accent-secondary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRight: '1px solid var(--border-color)',
                        fontWeight: isActive ? 'bold' : 'normal',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      aria-label={`Switch to ${tab.label} tab`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Active Tab Body Viewport */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {renderActiveDockContent()}
              </div>
            </div>
          </Card>
        </Panel>
      </Group>

      {/* Bottom Timeline Playback Navigation Toolbar */}
      {isTimelineVisible && (
        <div
          style={{
            flex: '0 0 auto',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <TimelinePanel />
        </div>
      )}
    </div>
  )
}

export default WorkspaceContainer
