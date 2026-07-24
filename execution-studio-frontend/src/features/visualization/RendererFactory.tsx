import React from 'react'
import type { HeapObjectView } from '@/types/visualization.types'
import { DataStructureClassifier } from '@/features/object-graph/DataStructureClassifier'
import { ArrayRenderer } from './ArrayRenderer'
import { LinkedListRenderer } from './LinkedListRenderer'
import { BinaryTreeRenderer } from './BinaryTreeRenderer'
import { StackRenderer } from './StackRenderer'
import { QueueRenderer } from './QueueRenderer'
import { ObjectRenderer } from './ObjectRenderer'

export type RendererType =
  | 'ARRAY'
  | 'LINKED_LIST'
  | 'BINARY_TREE'
  | 'STACK'
  | 'QUEUE'
  | 'OBJECT'
  | 'STRING'

export interface RendererFactoryProps {
  obj: HeapObjectView
  prevObj?: HeapObjectView
  objects: Record<string, HeapObjectView>
  prevObjects?: Record<string, HeapObjectView>
  variableLabels: string[]
  isNew: boolean
  onObjectClick?: (objectId: string) => void
}

/**
 * RendererFactory — selects the correct educational renderer for a heap object.
 *
 * Decision tree:
 *   array type / [] → ArrayRenderer
 *   has next/prev fields → LinkedListRenderer (walk from this node as head)
 *   has left/right fields → BinaryTreeRenderer (walk from this node as root)
 *   class name contains 'Stack' / has 'top' → StackRenderer
 *   class name contains 'Queue' / has 'front' → QueueRenderer
 *   otherwise → ObjectRenderer (generic POJO fallback)
 *
 * Strings are rendered inline as a simple ObjectRenderer with the value shown.
 * Arrays, linked lists, trees, stacks and queues NEVER use ObjectRenderer.
 */
export const RendererFactory: React.FC<RendererFactoryProps> = React.memo(({
  obj,
  prevObj,
  objects,
  prevObjects,
  variableLabels,
  isNew,
  onObjectClick,
}) => {
  const { type } = DataStructureClassifier.classify(obj)

  switch (type) {
    case 'ARRAY':
      return (
        <ArrayRenderer
          obj={obj}
          prevObj={prevObj}
          variableLabels={variableLabels}
          isNew={isNew}
          onCellClick={onObjectClick}
        />
      )

    case 'LINKED_LIST':
      return (
        <LinkedListRenderer
          objects={objects}
          prevObjects={prevObjects}
          headObjectId={obj.objectId}
          variableLabels={variableLabels}
          isNew={isNew}
          onNodeClick={onObjectClick}
        />
      )

    case 'BINARY_TREE':
      return (
        <BinaryTreeRenderer
          objects={objects}
          prevObjects={prevObjects}
          rootObjectId={obj.objectId}
          variableLabels={variableLabels}
          isNew={isNew}
          onNodeClick={onObjectClick}
        />
      )

    case 'STACK':
      return (
        <StackRenderer
          obj={obj}
          prevObj={prevObj}
          variableLabels={variableLabels}
          isNew={isNew}
          onNodeClick={onObjectClick}
        />
      )

    case 'QUEUE':
      return (
        <QueueRenderer
          obj={obj}
          prevObj={prevObj}
          variableLabels={variableLabels}
          isNew={isNew}
          onNodeClick={onObjectClick}
        />
      )

    case 'STRING':
    case 'OBJECT':
    default:
      return (
        <ObjectRenderer
          obj={obj}
          prevObj={prevObj}
          variableLabels={variableLabels}
          isNew={isNew}
          onObjectClick={onObjectClick}
        />
      )
  }
})

RendererFactory.displayName = 'RendererFactory'

/**
 * Determine the renderer type for a given heap object (exposed for testing).
 */
export function getRendererType(obj: HeapObjectView): RendererType {
  if (!obj) return 'OBJECT'
  const { type } = DataStructureClassifier.classify(obj)
  switch (type) {
    case 'ARRAY': return 'ARRAY'
    case 'LINKED_LIST': return 'LINKED_LIST'
    case 'BINARY_TREE': return 'BINARY_TREE'
    case 'STACK': return 'STACK'
    case 'QUEUE': return 'QUEUE'
    case 'STRING': return 'STRING'
    default: return 'OBJECT'
  }
}

export default RendererFactory
