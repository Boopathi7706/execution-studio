import React from 'react'
import SplitPane from '@/components/SplitPane'
import { Card } from '@/components/Card'
import { useLayoutStore } from '@/store/useLayoutStore'
import TimelinePanel from '@/features/timeline/TimelinePanel'
import SourceViewerPanel from '@/features/source-viewer/SourceViewerPanel'
import CallStackPanel from '@/features/stack/CallStackPanel'
import VariablesPanel from '@/features/variables/VariablesPanel'
import HeapViewContainer from '@/features/heap/HeapViewContainer'

/**
 * High-level layout workspace container.
 * Arranges left-side timeline views and right-side state variables.
 */
export const WorkspaceContainer: React.FC = () => {
  const sidebarWidth = useLayoutStore((state) => state.sidebarWidth)
  const setSidebarWidth = useLayoutStore((state) => state.setSidebarWidth)

  const leftPane = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        padding: '16px',
      }}
    >
      <div className="workspace-panel" style={{ flex: 1 }}>
        <div className="panel-header">
          <span>Source Code Viewer</span>
        </div>
        <div className="panel-body" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
          <SourceViewerPanel />
        </div>
      </div>
      <div className="workspace-panel" style={{ height: '160px' }}>
        <div className="panel-header">
          <span>Timeline Navigation Controls</span>
        </div>
        <div className="panel-body">
          <TimelinePanel />
        </div>
      </div>
    </div>
  )

  const rightPane = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        padding: '16px 16px 16px 0',
      }}
    >
      <div className="placeholders-grid">
        <Card title="Call Stack">
          <CallStackPanel />
        </Card>
        <Card title="Local Variables">
          <VariablesPanel />
        </Card>
        <Card title="Heap Memory Visualizer">
          <HeapViewContainer />
        </Card>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
      <SplitPane
        left={leftPane}
        right={rightPane}
        initialWidth={sidebarWidth}
        minWidth={400}
        maxWidth={1000}
        onChange={setSidebarWidth}
      />
    </div>
  )
}
export default WorkspaceContainer
