export interface NodePosition {
  x: number
  y: number
}

/**
 * Deterministic JVM Memory Canvas Layout Engine.
 * Preserves object position cache across timeline steps to guarantee mental map stability.
 * Assigns positions using structural heuristics:
 * - Linked List / Chains: Appends horizontally to the right (+185px, 0px)
 * - Binary Tree: Places left/right children beneath parents (-120px / +120px, +140px)
 * - Root Heap Objects: Organizes cleanly in a horizontal memory grid
 */
export class MemoryCanvasLayoutEngine {
  private positionCache = new Map<string, NodePosition>()

  /**
   * Clears position cache (used on new execution load, restart, or layout reset).
   */
  clear() {
    this.positionCache.clear()
  }

  /**
   * Checks if an object has an assigned coordinate in memory layout.
   */
  hasPosition(objectId: string): boolean {
    return this.positionCache.has(objectId)
  }

  /**
   * Retrieves assigned position for object.
   */
  getCachedPosition(objectId: string): NodePosition | undefined {
    return this.positionCache.get(objectId)
  }

  /**
   * Resolves or calculates stable (x,y) coordinates for a heap object card.
   */
  getPosition(
    objectId: string,
    referencingParentId?: string,
    fieldRelationName?: string,
    objectIndex: number = 0,
  ): NodePosition {
    // 1. Return cached position if already assigned
    if (this.positionCache.has(objectId)) {
      return this.positionCache.get(objectId)!
    }

    let pos: NodePosition = { x: 100, y: 150 }

    // 2. If newly allocated object has a parent reference, calculate structural placement
    if (referencingParentId && this.positionCache.has(referencingParentId)) {
      const parentPos = this.positionCache.get(referencingParentId)!
      const rel = (fieldRelationName || '').toLowerCase()

      if (rel.includes('left')) {
        // Binary tree left child: down-left
        pos = { x: parentPos.x - 120, y: parentPos.y + 140 }
      } else if (rel.includes('right')) {
        // Binary tree right child: down-right
        pos = { x: parentPos.x + 120, y: parentPos.y + 140 }
      } else if (rel.includes('next')) {
        // Linked list next pointer: horizontal right
        pos = { x: parentPos.x + 185, y: parentPos.y }
      } else {
        // General object reference: offset right & staggered
        pos = { x: parentPos.x + 160, y: parentPos.y + (objectIndex % 2 === 0 ? 50 : -50) }
      }
    } else {
      // 3. Root object: position in a clean horizontal grid layout
      const cols = 4
      const row = Math.floor(objectIndex / cols)
      const col = objectIndex % cols
      pos = { x: 100 + col * 220, y: 120 + row * 180 }
    }

    this.positionCache.set(objectId, pos)
    return pos
  }

  /**
   * Explicitly sets position for object.
   */
  setPosition(objectId: string, pos: NodePosition) {
    this.positionCache.set(objectId, pos)
  }

  /**
   * Removes dead object ID from position cache on garbage collection.
   */
  removeObject(objectId: string) {
    this.positionCache.delete(objectId)
  }
}

export const memoryLayoutEngine = new MemoryCanvasLayoutEngine()
