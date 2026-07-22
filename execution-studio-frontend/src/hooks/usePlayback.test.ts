// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayback } from './usePlayback'
import { usePlaybackStore, type TraceEvent } from '../store/usePlaybackStore'

const mockTimeline: TraceEvent[] = [
  { sequence: 1, sourceFile: 'Test.java', className: 'Test', methodName: 'main', lineNumber: 3 },
  { sequence: 2, sourceFile: 'Test.java', className: 'Test', methodName: 'main', lineNumber: 4 },
  { sequence: 3, sourceFile: 'Test.java', className: 'Test', methodName: 'main', lineNumber: 5 },
]

describe('usePlayback', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    usePlaybackStore.getState().loadTraceTimeline('test-id', 'COMPLETED', mockTimeline)
  })

  it('should initialize with first frame selected', () => {
    const { result } = renderHook(() => usePlayback())

    expect(result.current.currentFrameIndex).toBe(0)
    expect(result.current.totalFrameCount).toBe(3)
    expect(result.current.canStepPrev).toBe(false)
    expect(result.current.canStepNext).toBe(true)
  })

  it('should navigate forward, backward, first, last, and jump', () => {
    const { result } = renderHook(() => usePlayback())

    // Step Next
    act(() => {
      result.current.stepNext()
    })
    expect(result.current.currentFrameIndex).toBe(1)

    // Jump to last frame
    act(() => {
      result.current.lastFrame()
    })
    expect(result.current.currentFrameIndex).toBe(2)
    expect(result.current.canStepNext).toBe(false)

    // Jump to frame 0
    act(() => {
      result.current.firstFrame()
    })
    expect(result.current.currentFrameIndex).toBe(0)

    // Jump to frame index 1 directly
    act(() => {
      result.current.jumpToFrame(1)
    })
    expect(result.current.currentFrameIndex).toBe(1)
  })

  it('should toggle play and update speed', () => {
    const { result } = renderHook(() => usePlayback())

    act(() => {
      result.current.togglePlay()
    })
    expect(result.current.isPlaying).toBe(true)

    act(() => {
      result.current.setSpeed(2.0)
    })
    expect(result.current.playSpeed).toBe(2.0)

    act(() => {
      result.current.stop()
    })
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentFrameIndex).toBe(0)
  })
})
