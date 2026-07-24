export interface DOMRectLike {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface ArrowPoint {
  x: number
  y: number
}

export interface CalculatedEdge {
  id: string
  varName: string
  objectId: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
}

/**
 * Checks if a bounding rectangle is partially or fully visible within a viewport rectangle.
 */
export function isRectVisibleWithin(rect: DOMRectLike, viewportRect: DOMRectLike): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false
  return !(
    rect.right < viewportRect.left ||
    rect.left > viewportRect.right ||
    rect.bottom < viewportRect.top ||
    rect.top > viewportRect.bottom
  )
}

/**
 * Calculates start (source right center) and end (target left center) points
 * relative to an overlay container's bounding rectangle.
 */
export function calculateEdgeGeometry(
  sourceRect: DOMRectLike,
  targetRect: DOMRectLike,
  overlayRect: DOMRectLike
): { startX: number; startY: number; endX: number; endY: number } {
  const startX = sourceRect.right - overlayRect.left
  const startY = sourceRect.top + sourceRect.height / 2 - overlayRect.top

  const endX = targetRect.left - overlayRect.left
  const endY = targetRect.top + targetRect.height / 2 - overlayRect.top

  return { startX, startY, endX, endY }
}

/**
 * Maps variable name to reference arrow color based on naming semantics.
 */
export function getReferenceArrowColor(varName: string): string {
  const lowerName = varName.toLowerCase()
  if (
    lowerName.includes('head') ||
    lowerName.includes('tail') ||
    lowerName.includes('node') ||
    lowerName.includes('list')
  ) {
    return '#ef4444' // Red for linked list pointers
  }
  if (
    lowerName.includes('arr') ||
    lowerName.includes('array') ||
    lowerName.includes('nums')
  ) {
    return '#22c55e' // Green for array references
  }
  return '#c084fc' // Purple for general object references
}
