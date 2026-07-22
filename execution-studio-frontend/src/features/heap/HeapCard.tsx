import React from 'react'
import type { HeapObjectView, VisualizationModel } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import ObjectCard from './ObjectCard'
import ArrayCard from './ArrayCard'

interface HeapCardProps {
  obj: HeapObjectView
  previousModel: VisualizationModel | null
}

/**
 * Smart router HeapCard component.
 * Reads global expansion state from Zustand store and routes to ArrayCard or ObjectCard.
 */
export const HeapCard: React.FC<HeapCardProps> = React.memo(({ obj, previousModel }) => {
  const expandedObjects = usePlaybackStore((state) => state.expandedObjects)
  const toggleObjectExpanded = usePlaybackStore((state) => state.toggleObjectExpanded)

  const isExpanded = expandedObjects[obj.objectId] !== false
  const handleToggleExpand = () => toggleObjectExpanded(obj.objectId)

  const isArray =
    obj.type === 'array' ||
    (obj.classNameOrType &&
      (obj.classNameOrType.endsWith('[]') || obj.classNameOrType.includes('[]')))

  if (isArray) {
    return (
      <ArrayCard
        obj={obj}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        previousModel={previousModel}
      />
    )
  }

  return (
    <ObjectCard
      obj={obj}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      previousModel={previousModel}
    />
  )
})

HeapCard.displayName = 'HeapCard'
export default HeapCard
