package com.executionstudio.playback.session;

/**
 * Lightweight metadata about the active playback state.
 *
 * @param currentStep        1-based index of the current execution step
 * @param totalSteps         total steps available in the trace
 * @param progressPercentage progress percentage from 0.0 to 100.0
 */
public record PlaybackMetadata(
    int currentStep,
    int totalSteps,
    double progressPercentage
) {}
