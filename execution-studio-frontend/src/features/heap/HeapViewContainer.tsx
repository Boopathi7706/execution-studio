import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import HeapCard from './HeapCard'

/**
 * Heap elements panel container.
 * Visualizes allocated objects on the JVM heap.
 */
export const HeapViewContainer: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const previousModel = usePlaybackStore((state) => state.previousModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)

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
        <HeapCard key={obj.objectId} obj={obj} previousModel={previousModel} />
      ))}
    </div>
  )
}

export default HeapViewContainer
