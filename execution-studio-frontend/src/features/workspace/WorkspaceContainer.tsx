import React from 'react'
import SplitPane from '@/components/SplitPane'
import { Card } from '@/components/Card'
import { useLayoutStore } from '@/store/useLayoutStore'

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
        <div className="panel-body">
          <p>Monaco Code Editor placeholder card</p>
        </div>
      </div>
      <div className="workspace-panel" style={{ height: '120px' }}>
        <div className="panel-header">
          <span>Timeline Navigation Controls</span>
        </div>
        <div className="panel-body">
          <p>Timeline Playback scrubber placeholder card</p>
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
          <p>Call Stack Frames placeholder card</p>
        </Card>
        <Card title="Local Variables">
          <p>Local Variables table placeholder card</p>
        </Card>
        <Card title="Heap Memory Visualizer">
          <p>Heap Object Graph reference graph placeholder card</p>
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
// Note: We keep export default so that App.tsx can cleanly import it.
