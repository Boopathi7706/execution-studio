import { describe, it, expect } from 'vitest'
import {
  calculateVerticalWorkspaceResize,
  TOP_MIN_HEIGHT,
  BOTTOM_MIN_HEIGHT,
  SEPARATOR_HEIGHT,
} from './verticalResizeMath'

describe('verticalResizeMath Phase 2.2 — Baseline Invariant Tests', () => {
  const availableWorkspaceHeight = 650

  it('1. Downward redistribution before Bottom minimum', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 450,
      dragStartBottomHeight: 195,
      deltaY: 30,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(480)
    expect(res.bottomHeight).toBe(165)
    expect(res.totalHeight).toBe(availableWorkspaceHeight)
    expect(res.extraExpansion).toBe(0)
  })

  it('2. Downward transition exactly to Bottom minimum', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 450,
      dragStartBottomHeight: 195,
      deltaY: 45,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(495)
    expect(res.bottomHeight).toBe(BOTTOM_MIN_HEIGHT)
    expect(res.totalHeight).toBe(availableWorkspaceHeight)
    expect(res.extraExpansion).toBe(0)
  })

  it('3. Downward expansion after Bottom minimum', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 450,
      dragStartBottomHeight: 195,
      deltaY: 245,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(695)
    expect(res.bottomHeight).toBe(BOTTOM_MIN_HEIGHT)
    expect(res.totalHeight).toBe(650 + 200)
    expect(res.extraExpansion).toBe(200)
  })

  it('4. Upward contraction while still expanded', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 795,
      dragStartBottomHeight: 150,
      deltaY: -100,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(695)
    expect(res.bottomHeight).toBe(BOTTOM_MIN_HEIGHT)
    expect(res.totalHeight).toBe(850)
    expect(res.extraExpansion).toBe(200)
  })

  it('5. Upward contraction exactly back to baseline', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 795,
      dragStartBottomHeight: 150,
      deltaY: -300,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(495)
    expect(res.bottomHeight).toBe(BOTTOM_MIN_HEIGHT)
    expect(res.totalHeight).toBe(availableWorkspaceHeight)
    expect(res.extraExpansion).toBe(0)
  })

  it('6. Upward movement continuing past baseline in SAME drag', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 795,
      dragStartBottomHeight: 150,
      deltaY: -345,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(450)
    expect(res.bottomHeight).toBe(195)
    expect(res.totalHeight).toBe(availableWorkspaceHeight)
    expect(res.extraExpansion).toBe(0)
  })

  it('7. Very large upward delta: Top stops at TOP_MIN_HEIGHT and workspace equals available height', () => {
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 795,
      dragStartBottomHeight: 150,
      deltaY: -900,
      availableWorkspaceHeight,
    })
    expect(res.topHeight).toBe(TOP_MIN_HEIGHT) // 300
    expect(res.bottomHeight).toBe(availableWorkspaceHeight - SEPARATOR_HEIGHT - TOP_MIN_HEIGHT) // 345
    expect(res.totalHeight).toBe(availableWorkspaceHeight) // 650 (NO BLANK SPACE!)
    expect(res.extraExpansion).toBe(0)
  })

  it('8. Round-trip symmetry (normal -> expand 500px -> contract 500px returns to original geometry)', () => {
    const expandRes = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 450,
      dragStartBottomHeight: 195,
      deltaY: 500,
      availableWorkspaceHeight,
    })
    const contractRes = calculateVerticalWorkspaceResize({
      dragStartTopHeight: expandRes.topHeight,
      dragStartBottomHeight: expandRes.bottomHeight,
      deltaY: -500,
      availableWorkspaceHeight,
    })
    expect(contractRes.topHeight).toBe(450)
    expect(contractRes.bottomHeight).toBe(195)
    expect(contractRes.totalHeight).toBe(availableWorkspaceHeight)
    expect(contractRes.extraExpansion).toBe(0)
  })

  it('9. No blank-space invariant: top + separator + bottom === availableHeight for every normal-mode result', () => {
    const deltas = [-300, -100, -45, 0, 20, 45]
    deltas.forEach((d) => {
      const res = calculateVerticalWorkspaceResize({
        dragStartTopHeight: 450,
        dragStartBottomHeight: 195,
        deltaY: d,
        availableWorkspaceHeight,
      })
      expect(res.totalHeight).toBe(availableWorkspaceHeight)
    })
  })

  it('10. Expanded invariant: bottom === BOTTOM_MIN_HEIGHT and top + separator + bottom === availableHeight + extraExpansion', () => {
    const deltas = [100, 250, 500, 1000]
    deltas.forEach((d) => {
      const res = calculateVerticalWorkspaceResize({
        dragStartTopHeight: 450,
        dragStartBottomHeight: 195,
        deltaY: d,
        availableWorkspaceHeight,
      })
      expect(res.bottomHeight).toBe(BOTTOM_MIN_HEIGHT)
      expect(res.totalHeight).toBe(availableWorkspaceHeight + res.extraExpansion)
    })
  })

  it('11. Browser resize larger while normal: workspace adapts and fills new available height', () => {
    const newAvailable = 800
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 450,
      dragStartBottomHeight: 195,
      deltaY: 0,
      availableWorkspaceHeight: newAvailable,
    })
    expect(res.totalHeight).toBe(newAvailable)
  })

  it('12. Browser resize smaller while normal: constraints remain valid', () => {
    const smallAvailable = 500
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 300,
      dragStartBottomHeight: 195,
      deltaY: 0,
      availableWorkspaceHeight: smallAvailable,
    })
    expect(res.topHeight).toBeGreaterThanOrEqual(TOP_MIN_HEIGHT)
    expect(res.bottomHeight).toBeGreaterThanOrEqual(BOTTOM_MIN_HEIGHT)
    expect(res.totalHeight).toBe(smallAvailable)
  })

  it('13. Browser resize while expanded: preserves intentional expansion consistently', () => {
    const newAvailable = 750
    const res = calculateVerticalWorkspaceResize({
      dragStartTopHeight: 795,
      dragStartBottomHeight: 150,
      deltaY: 0,
      availableWorkspaceHeight: newAvailable,
    })
    expect(res.bottomHeight).toBe(BOTTOM_MIN_HEIGHT)
    expect(res.extraExpansion).toBe(200)
    expect(res.totalHeight).toBe(newAvailable + 200)
  })
})
