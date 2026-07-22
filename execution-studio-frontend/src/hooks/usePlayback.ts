import { usePlaybackStore } from '../store/usePlaybackStore'

export function usePlayback() {
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const playSpeed = usePlaybackStore((state) => state.playSpeed)
  const currentFrameIndex = usePlaybackStore((state) => state.currentFrameIndex)
  const totalFrameCount = usePlaybackStore((state) => state.totalFrameCount)
  const timeline = usePlaybackStore((state) => state.timeline)
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const currentFrame = timeline[currentFrameIndex] || null

  const togglePlay = usePlaybackStore((state) => state.togglePlay)
  const stop = usePlaybackStore((state) => state.stop)
  const stepNext = usePlaybackStore((state) => state.stepNext)
  const stepPrev = usePlaybackStore((state) => state.stepPrev)
  const firstFrame = usePlaybackStore((state) => state.firstFrame)
  const lastFrame = usePlaybackStore((state) => state.lastFrame)
  const jumpToFrame = usePlaybackStore((state) => state.jumpToFrame)
  const setSpeed = usePlaybackStore((state) => state.setSpeed)

  return {
    isPlaying,
    playSpeed,
    currentFrameIndex,
    totalFrameCount,
    timeline,
    currentFrame,
    currentModel,
    canStepNext: currentFrameIndex < totalFrameCount - 1 && totalFrameCount > 0,
    canStepPrev: currentFrameIndex > 0 && totalFrameCount > 0,
    togglePlay,
    stop,
    stepNext,
    stepPrev,
    firstFrame,
    lastFrame,
    jumpToFrame,
    setSpeed,
  }
}
