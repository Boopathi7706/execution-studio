// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TimelinePanel } from './TimelinePanel'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { PlaybackMetadata } from '@/types/metadata.types'

const mockMetadata = (index: number, total: number = 100): PlaybackMetadata => ({
  currentStepIndex: index,
  totalSteps: total,
  progressPercentage: (index / (total - 1 || 1)) * 100,
})

describe('TimelinePanel Component', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders disabled controls when session is disconnected', () => {
    usePlaybackStore.setState({ connectionStatus: 'DISCONNECTED', metadata: null })

    render(<TimelinePanel />)

    // Verify step progress text shows no active session
    expect(screen.getByText('No Active Session')).toBeDefined()

    // Verify all control buttons are disabled using native DOM properties
    expect((screen.getByLabelText('Restart') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Step Backward') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Play') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Step Forward') as HTMLButtonElement).disabled).toBe(true)

    // Verify speed select and timeline scrubber range inputs are disabled
    expect((screen.getByLabelText('Timeline scrubber') as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true)
  })

  it('renders enabled controls and progress metrics when session is connected', () => {
    const meta = mockMetadata(24, 100) // index 24 is step 25
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      metadata: meta,
    })

    render(<TimelinePanel />)

    // Verify step progress text displays step 25 / 100
    expect(screen.getByText('Step 25 / 100')).toBeDefined()
    expect(screen.getByText('24%')).toBeDefined()

    // Verify all control buttons are enabled
    expect((screen.getByLabelText('Restart') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByLabelText('Step Backward') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByLabelText('Play') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByLabelText('Step Forward') as HTMLButtonElement).disabled).toBe(false)

    // Verify speed select and timeline scrubber range inputs are enabled
    const scrubber = screen.getByLabelText('Timeline scrubber') as HTMLInputElement
    expect(scrubber.disabled).toBe(false)
    expect(scrubber.value).toBe('24')
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(false)
  })

  it('triggers store actions on control button clicks', () => {
    const meta = mockMetadata(10, 50)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      metadata: meta,
    })

    // Setup spies on Zustand actions with typed resolve values
    const stepForwardSpy = vi
      .spyOn(usePlaybackStore.getState(), 'stepForward')
      .mockResolvedValue(undefined as never)
    const stepBackwardSpy = vi
      .spyOn(usePlaybackStore.getState(), 'stepBackward')
      .mockResolvedValue(undefined as never)
    const restartSpy = vi
      .spyOn(usePlaybackStore.getState(), 'restart')
      .mockResolvedValue(undefined as never)
    const togglePlaySpy = vi.spyOn(usePlaybackStore.getState(), 'togglePlay')

    render(<TimelinePanel />)

    // Test Play Button
    fireEvent.click(screen.getByLabelText('Play'))
    expect(togglePlaySpy).toHaveBeenCalledTimes(1)

    // Test Step Forward
    fireEvent.click(screen.getByLabelText('Step Forward'))
    expect(stepForwardSpy).toHaveBeenCalledTimes(1)

    // Test Step Backward
    fireEvent.click(screen.getByLabelText('Step Backward'))
    expect(stepBackwardSpy).toHaveBeenCalledTimes(1)

    // Test Restart
    fireEvent.click(screen.getByLabelText('Restart'))
    expect(restartSpy).toHaveBeenCalledTimes(1)
  })

  it('triggers setSpeed when playback rate option is selected', () => {
    usePlaybackStore.setState({ connectionStatus: 'CONNECTED', metadata: mockMetadata(0) })
    const setSpeedSpy = vi.spyOn(usePlaybackStore.getState(), 'setSpeed')

    render(<TimelinePanel />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '2' } })

    expect(setSpeedSpy).toHaveBeenCalledWith(2.0)
  })

  it('triggers seek when timeline range scrubber is adjusted', () => {
    usePlaybackStore.setState({ connectionStatus: 'CONNECTED', metadata: mockMetadata(5, 20) })
    const seekSpy = vi
      .spyOn(usePlaybackStore.getState(), 'seek')
      .mockResolvedValue(undefined as never)

    render(<TimelinePanel />)

    const scrubber = screen.getByLabelText('Timeline scrubber')
    fireEvent.change(scrubber, { target: { value: '15' } })

    expect(seekSpy).toHaveBeenCalledWith(15)
  })

  it('handles keyboard shortcuts globally on active session', () => {
    usePlaybackStore.setState({ connectionStatus: 'CONNECTED', metadata: mockMetadata(5, 20) })
    const stepForwardSpy = vi
      .spyOn(usePlaybackStore.getState(), 'stepForward')
      .mockResolvedValue(undefined as never)
    const stepBackwardSpy = vi
      .spyOn(usePlaybackStore.getState(), 'stepBackward')
      .mockResolvedValue(undefined as never)
    const togglePlaySpy = vi.spyOn(usePlaybackStore.getState(), 'togglePlay')
    const restartSpy = vi
      .spyOn(usePlaybackStore.getState(), 'restart')
      .mockResolvedValue(undefined as never)

    render(<TimelinePanel />)

    // Space -> togglePlay
    fireEvent.keyDown(window, { key: ' ' })
    expect(togglePlaySpy).toHaveBeenCalledTimes(1)

    // ArrowRight -> stepForward
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(stepForwardSpy).toHaveBeenCalledTimes(1)

    // ArrowLeft -> stepBackward
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(stepBackwardSpy).toHaveBeenCalledTimes(1)

    // R -> restart
    fireEvent.keyDown(window, { key: 'r' })
    expect(restartSpy).toHaveBeenCalledTimes(1)
  })

  it('does not trigger keyboard shortcuts when typing inside form input fields', () => {
    usePlaybackStore.setState({ connectionStatus: 'CONNECTED', metadata: mockMetadata(5, 20) })
    const stepForwardSpy = vi
      .spyOn(usePlaybackStore.getState(), 'stepForward')
      .mockResolvedValue(undefined as never)

    render(
      <div>
        <input type="text" data-testid="input-box" />
        <TimelinePanel />
      </div>,
    )

    const inputBox = screen.getByTestId('input-box')
    inputBox.focus()

    // Fire ArrowRight inside the input box
    fireEvent.keyDown(inputBox, { key: 'ArrowRight', bubbles: true })
    expect(stepForwardSpy).not.toHaveBeenCalled()
  })
})
