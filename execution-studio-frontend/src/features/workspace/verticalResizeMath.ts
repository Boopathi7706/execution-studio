export interface VerticalResizeInput {
  dragStartTopHeight: number
  dragStartBottomHeight: number
  deltaY: number
  availableWorkspaceHeight: number
  topMinHeight?: number
  bottomMinHeight?: number
  separatorHeight?: number
}

export interface VerticalResizeResult {
  topHeight: number
  bottomHeight: number
  totalHeight: number
  extraExpansion: number
}

export const TOP_MIN_HEIGHT = 300
export const BOTTOM_MIN_HEIGHT = 150
export const SEPARATOR_HEIGHT = 5

/**
 * Calculates continuous vertical workspace heights during vertical divider drag.
 * Guarantee: totalHeight is NEVER less than availableWorkspaceHeight (No Blank Space Invariant).
 *
 * Math State Model:
 * 1. Normal Mode (extraExpansion === 0): top + separator + bottom === availableWorkspaceHeight.
 * 2. Expanded Mode (extraExpansion > 0): bottom === BOTTOM_MIN, top === baselineTop + extraExpansion, total === availableWorkspaceHeight + extraExpansion.
 * 3. Continuous transition in one pointer gesture without jumps or dead zones.
 */
export function calculateVerticalWorkspaceResize({
  dragStartTopHeight,
  dragStartBottomHeight,
  deltaY,
  availableWorkspaceHeight,
  topMinHeight = TOP_MIN_HEIGHT,
  bottomMinHeight = BOTTOM_MIN_HEIGHT,
  separatorHeight = SEPARATOR_HEIGHT,
}: VerticalResizeInput): VerticalResizeResult {
  const minTopForMinBottom = Math.max(topMinHeight, availableWorkspaceHeight - separatorHeight - bottomMinHeight)

  // 1. Calculate drag start extra expansion
  const dragStartTotal = dragStartTopHeight + separatorHeight + dragStartBottomHeight
  const initialExtraExpansion = Math.max(0, dragStartTotal - availableWorkspaceHeight)

  let topHeight: number
  let bottomHeight: number
  let extraExpansion: number

  if (deltaY >= 0) {
    // ── DOWNWARD DRAG ──────────────────────────────────────────────────────────
    const shrinkableBottom = Math.max(0, dragStartBottomHeight - bottomMinHeight)

    if (deltaY <= shrinkableBottom && initialExtraExpansion === 0) {
      // Normal redistribution in viewport
      topHeight = Math.max(topMinHeight, Math.round(dragStartTopHeight + deltaY))
      bottomHeight = Math.max(bottomMinHeight, Math.round(dragStartBottomHeight - deltaY))
      extraExpansion = 0
    } else {
      // Bottom panel at minimum — expand workspace height
      const addedExpansion = deltaY - shrinkableBottom
      extraExpansion = initialExtraExpansion + Math.max(0, addedExpansion)
      bottomHeight = bottomMinHeight
      topHeight = minTopForMinBottom + extraExpansion
    }
  } else {
    // ── UPWARD DRAG ────────────────────────────────────────────────────────────
    if (initialExtraExpansion > 0) {
      const newExtraExpansion = initialExtraExpansion + deltaY

      if (newExtraExpansion >= 0) {
        // Still expanded or exactly back at baseline
        extraExpansion = newExtraExpansion
        bottomHeight = bottomMinHeight
        topHeight = minTopForMinBottom + extraExpansion
      } else {
        // Consumed all extra expansion and crossed into Normal Mode in SAME gesture
        extraExpansion = 0
        const remainingNegativeDelta = newExtraExpansion // negative value
        const targetTop = minTopForMinBottom + remainingNegativeDelta
        topHeight = Math.max(topMinHeight, Math.round(targetTop))
        bottomHeight = Math.max(bottomMinHeight, availableWorkspaceHeight - separatorHeight - topHeight)
      }
    } else {
      // Starting from Normal Mode
      extraExpansion = 0
      const targetTop = dragStartTopHeight + deltaY
      topHeight = Math.max(topMinHeight, Math.round(targetTop))
      bottomHeight = Math.max(bottomMinHeight, availableWorkspaceHeight - separatorHeight - topHeight)
    }
  }

  // Enforce absolute baseline invariant: totalHeight NEVER less than availableWorkspaceHeight
  const computedTotal = topHeight + separatorHeight + bottomHeight
  const finalTotal = Math.max(availableWorkspaceHeight, computedTotal)

  return {
    topHeight,
    bottomHeight,
    totalHeight: finalTotal,
    extraExpansion,
  }
}
