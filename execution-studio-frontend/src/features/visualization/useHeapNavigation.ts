import { useCallback } from 'react'

export interface HeapNavigationTargetPosition {
  scrollTop: number
  scrollLeft: number
  alreadyVisible: boolean
}

/**
 * Calculates relative target scroll coordinates inside a scroll container.
 * Keeps target centered or nearest-center without scrolling parent elements.
 */
export function calculateHeapTargetScroll(
  targetRect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  viewportRect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  currentScroll: { top: number; left: number }
): HeapNavigationTargetPosition {
  const isVisible =
    targetRect.top >= viewportRect.top &&
    targetRect.bottom <= viewportRect.bottom &&
    targetRect.left >= viewportRect.left &&
    targetRect.right <= viewportRect.right

  const targetOffsetTop = targetRect.top - viewportRect.top + currentScroll.top
  const targetOffsetLeft = targetRect.left - viewportRect.left + currentScroll.left

  const desiredTop = Math.max(0, targetOffsetTop - viewportRect.height / 2 + targetRect.height / 2)
  const desiredLeft = Math.max(0, targetOffsetLeft - viewportRect.width / 2 + targetRect.width / 2)

  return {
    scrollTop: Math.round(desiredTop),
    scrollLeft: Math.round(desiredLeft),
    alreadyVisible: isVisible,
  }
}

/**
 * Reusable Heap Object Navigation hook.
 * Locates target heap object [data-heap-object-id="<objectId>"] inside [data-viewport="heap"],
 * scrolls ONLY the heap viewport smoothly, and temporarily highlights the target.
 */
export function useHeapNavigation() {
  const navigateToHeapObject = useCallback((objectId: string | null | undefined) => {
    if (!objectId || typeof objectId !== 'string') return false

    const cleanId = objectId.replace(/^@/, '')

    // 1. Locate Heap Viewport scroll container
    const heapVp = document.querySelector<HTMLElement>('[data-viewport="heap"]')
    if (!heapVp) return false

    // 2. Locate target element by data attribute or id
    const targetEl =
      heapVp.querySelector<HTMLElement>(`[data-heap-object-id="${cleanId}"]`) ||
      heapVp.querySelector<HTMLElement>(`[data-heap-object-id="${objectId}"]`) ||
      document.getElementById(`heap-obj-${cleanId}`) ||
      document.getElementById(`heap-obj-${objectId}`)

    if (!targetEl) return false // Fail safely

    const vpRect = heapVp.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()

    const { scrollTop, scrollLeft, alreadyVisible } = calculateHeapTargetScroll(
      targetRect,
      vpRect,
      { top: heapVp.scrollTop, left: heapVp.scrollLeft }
    )

    // 3. Scroll ONLY the Heap viewport (if not already visible)
    if (!alreadyVisible) {
      heapVp.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: 'smooth',
      })
    }

    // 4. Temporarily highlight target element (1200ms)
    targetEl.setAttribute('data-reference-target-active', 'true')
    setTimeout(() => {
      targetEl.removeAttribute('data-reference-target-active')
    }, 1200)

    return true
  }, [])

  return { navigateToHeapObject }
}

export default useHeapNavigation
