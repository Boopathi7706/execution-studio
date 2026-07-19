import type { ReferenceGraph } from '@/types/visualization.types'
import type { LayoutModel } from '@/types/layout.types'

/**
 * Placeholder engine signature for calculating nodes visual layout coordinates.
 */
export class GraphLayoutEngine {
  calculateLayout(_graph: ReferenceGraph): Promise<LayoutModel> {
    throw new Error('GraphLayoutEngine calculation not implemented')
  }
}
