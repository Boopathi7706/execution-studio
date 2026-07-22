import React, { useState } from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import HeapCard from './HeapCard'
import ObjectGraphPanel from '@/features/object-graph/ObjectGraphPanel'

/**
 * Heap elements panel container.
 * Displays tabs allowing selection between JVM Heap cards list and Object Reference Graph visualizer.
 */
export const HeapViewContainer: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const previousModel = usePlaybackStore((state) => state.previousModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)

  const [activeTab, setActiveTab] = useState<'cards' | 'graph'>('cards')

  const isConnected = connectionStatus === 'CONNECTED'
  const objects = isConnected && currentModel?.heap?.objects ? currentModel.heap.objects : {}
  const objectValues = Object.values(objects)

  if (!isConnected || objectValues.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontStyle: 'italic',
        }}
        className="heap-empty"
      >
        No heap objects allocated.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Switch Tab Headers */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)',
        }}
      >
        <button
          onClick={() => setActiveTab('cards')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'cards' ? 'var(--bg-secondary)' : 'transparent',
            border: 'none',
            borderRight: '1px solid var(--border-color)',
            color: activeTab === 'cards' ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeTab === 'cards' ? 'bold' : 'normal',
            outline: 'none',
            transition: 'color var(--transition-fast)',
          }}
          aria-label="Heap Cards View"
        >
          Heap Elements Card List
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'graph' ? 'var(--bg-secondary)' : 'transparent',
            border: 'none',
            borderRight: '1px solid var(--border-color)',
            color: activeTab === 'graph' ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeTab === 'graph' ? 'bold' : 'normal',
            outline: 'none',
            transition: 'color var(--transition-fast)',
          }}
          aria-label="Object Graph View"
        >
          Object Reference Graph
        </button>
      </div>

      {/* Switch Tab Viewports */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'cards' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px',
              padding: '16px',
              overflowY: 'auto',
              height: '100%',
              maxHeight: '100%',
              backgroundColor: 'var(--bg-secondary)',
              alignContent: 'start',
            }}
            className="heap-list-panel"
          >
            {objectValues.map((obj) => (
              <HeapCard
                key={obj.objectId}
                obj={obj}
                previousModel={previousModel}
              />
            ))}
          </div>
        ) : (
          <ObjectGraphPanel />
        )}
      </div>
    </div>
  )
}

export default HeapViewContainer
