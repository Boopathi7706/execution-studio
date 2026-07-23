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
 * Arranges left-side timeline/editor views and right-side execution state panels.
 */
export const WorkspaceContainer: React.FC = () => {
  const sidebarWidth = useLayoutStore((state) => state.sidebarWidth)
  const setSidebarWidth = useLayoutStore((state) => state.setSidebarWidth)

  const leftPane = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        minHeight: 0,
        padding: '12px',
      }}
    >
      <div className="workspace-panel" style={{ flex: 1, minHeight: 0 }}>
        <div className="panel-header">
          <span>Java Source Editor</span>
        </div>
        <div className="panel-body" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
          <SourceViewerPanel />
        </div>
      </div>
      <div className="workspace-panel" style={{ height: '140px', flexShrink: 0 }}>
        <div className="panel-header">
          <span>Timeline Navigation Controls</span>
        </div>
        <div className="panel-body" style={{ padding: '8px 12px' }}>
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
        height: '100%',
        minHeight: 0,
        padding: '12px 12px 12px 0',
      }}
    >
      <div className="placeholders-grid">
        <Card title="Call Stack">
          <CallStackPanel />
        </Card>
        <Card title="Local Variables">
          <VariablesPanel />
        </Card>
        <Card title="Heap Memory & Object Graph">
          <HeapViewContainer />
        </Card>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflow: 'hidden', height: '100%', minHeight: 0 }}>
      <SplitPane
        left={leftPane}
        right={rightPane}
        initialWidth={sidebarWidth}
        minWidth={380}
        maxWidth={1100}
        onChange={setSidebarWidth}
      />
    </div>
  )
}
export default WorkspaceContainer
