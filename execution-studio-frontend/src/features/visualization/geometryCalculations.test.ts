import { describe, it, expect } from 'vitest'
import {
  isRectVisibleWithin,
  calculateEdgeGeometry,
  getReferenceArrowColor,
  type DOMRectLike,
} from './geometryCalculations'

describe('geometryCalculations', () => {
  describe('isRectVisibleWithin', () => {
    const viewport: DOMRectLike = {
      left: 100,
      top: 100,
      right: 500,
      bottom: 500,
      width: 400,
      height: 400,
    }

    it('returns true for fully inside rect', () => {
      const rect: DOMRectLike = { left: 150, top: 150, right: 250, bottom: 250, width: 100, height: 100 }
      expect(isRectVisibleWithin(rect, viewport)).toBe(true)
    })

    it('returns true for partially overlapping rect', () => {
      const rect: DOMRectLike = { left: 50, top: 50, right: 150, bottom: 150, width: 100, height: 100 }
      expect(isRectVisibleWithin(rect, viewport)).toBe(true)
    })

    it('returns false for completely outside rect (above/left)', () => {
      const rect: DOMRectLike = { left: 10, top: 10, right: 90, bottom: 90, width: 80, height: 80 }
      expect(isRectVisibleWithin(rect, viewport)).toBe(false)
    })

    it('returns false for completely outside rect (below/right)', () => {
      const rect: DOMRectLike = { left: 510, top: 510, right: 600, bottom: 600, width: 90, height: 90 }
      expect(isRectVisibleWithin(rect, viewport)).toBe(false)
    })

    it('returns false for zero dimensions', () => {
      const rect: DOMRectLike = { left: 150, top: 150, right: 150, bottom: 150, width: 0, height: 0 }
      expect(isRectVisibleWithin(rect, viewport)).toBe(false)
    })
  })

  describe('calculateEdgeGeometry', () => {
    it('correctly calculates overlay-relative start (right-center) and end (left-center) points', () => {
      const overlayRect: DOMRectLike = { left: 50, top: 50, right: 850, bottom: 650, width: 800, height: 600 }
      const sourceRect: DOMRectLike = { left: 100, top: 100, right: 200, bottom: 140, width: 100, height: 40 }
      const targetRect: DOMRectLike = { left: 400, top: 200, right: 550, bottom: 300, width: 150, height: 100 }

      const geom = calculateEdgeGeometry(sourceRect, targetRect, overlayRect)

      // startX = source.right (200) - overlay.left (50) = 150
      expect(geom.startX).toBe(150)
      // startY = source.top (100) + 20 - overlay.top (50) = 70
      expect(geom.startY).toBe(70)

      // endX = target.left (400) - overlay.left (50) = 350
      expect(geom.endX).toBe(350)
      // endY = target.top (200) + 50 - overlay.top (50) = 200
      expect(geom.endY).toBe(200)
    })
  })

  describe('getReferenceArrowColor', () => {
    it('returns red for linked list related variable names', () => {
      expect(getReferenceArrowColor('head')).toBe('#ef4444')
      expect(getReferenceArrowColor('dummyNode')).toBe('#ef4444')
    })

    it('returns green for array related variable names', () => {
      expect(getReferenceArrowColor('arr')).toBe('#22c55e')
      expect(getReferenceArrowColor('nums')).toBe('#22c55e')
    })

    it('returns purple for general variables', () => {
      expect(getReferenceArrowColor('s1')).toBe('#c084fc')
      expect(getReferenceArrowColor('student')).toBe('#c084fc')
    })
  })
})
