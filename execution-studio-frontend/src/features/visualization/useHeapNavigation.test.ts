import { describe, it, expect } from 'vitest'
import { calculateHeapTargetScroll } from './useHeapNavigation'

describe('useHeapNavigation & calculateHeapTargetScroll', () => {
  const viewportRect = {
    left: 100,
    top: 100,
    right: 600,
    bottom: 500,
    width: 500,
    height: 400,
  }

  it('detects when target object is already fully visible in heap viewport', () => {
    const targetRect = {
      left: 150,
      top: 150,
      right: 350,
      bottom: 250,
      width: 200,
      height: 100,
    }

    const result = calculateHeapTargetScroll(targetRect, viewportRect, { top: 0, left: 0 })
    expect(result.alreadyVisible).toBe(true)
  })

  it('calculates correct vertical scroll offset for target far below', () => {
    const targetRect = {
      left: 150,
      top: 800,
      right: 350,
      bottom: 900,
      width: 200,
      height: 100,
    }

    const result = calculateHeapTargetScroll(targetRect, viewportRect, { top: 0, left: 0 })
    expect(result.alreadyVisible).toBe(false)
    // targetOffsetTop = 800 - 100 + 0 = 700
    // desiredTop = 700 - 200 + 50 = 550
    expect(result.scrollTop).toBe(550)
  })

  it('calculates correct horizontal scroll offset for target far right', () => {
    const targetRect = {
      left: 900,
      top: 150,
      right: 1100,
      bottom: 250,
      width: 200,
      height: 100,
    }

    const result = calculateHeapTargetScroll(targetRect, viewportRect, { top: 0, left: 0 })
    expect(result.alreadyVisible).toBe(false)
    // targetOffsetLeft = 900 - 100 = 800
    // desiredLeft = 800 - 250 + 100 = 650
    expect(result.scrollLeft).toBe(650)
  })

  it('calculates both vertical and horizontal scroll offsets for diagonal targets', () => {
    const targetRect = {
      left: 800,
      top: 700,
      right: 1000,
      bottom: 800,
      width: 200,
      height: 100,
    }

    const result = calculateHeapTargetScroll(targetRect, viewportRect, { top: 0, left: 0 })
    expect(result.alreadyVisible).toBe(false)
    expect(result.scrollTop).toBeGreaterThan(0)
    expect(result.scrollLeft).toBeGreaterThan(0)
  })
})
