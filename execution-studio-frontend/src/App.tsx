import React from 'react'
import WorkspaceContainer from './features/workspace/WorkspaceContainer'
import TimelinePanel from './features/timeline/TimelinePanel'
import SourceViewerPanel from './features/source-viewer/SourceViewerPanel'
import CallStackPanel from './features/stack/CallStackPanel'
import VariablesPanel from './features/variables/VariablesPanel'
import HeapViewContainer from './features/heap/HeapViewContainer'
import { Card } from './components/Card'

import './App.css'

export const App: React.FC = () => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header>
        <h1>Execution Studio (Sprint 1 Setup)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Frontend architectural components scaffolded successfully.
        </p>
      </header>

      <WorkspaceContainer />

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Source Code Viewer">
            <SourceViewerPanel />
          </Card>
          <Card title="Timeline Navigation">
            <TimelinePanel />
          </Card>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Call Stack">
            <CallStackPanel />
          </Card>
          <Card title="Local Variables">
            <VariablesPanel />
          </Card>
          <Card title="Heap Memory Visualizer">
            <HeapViewContainer />
          </Card>
        </section>
      </main>
    </div>
  )
}

export default App
