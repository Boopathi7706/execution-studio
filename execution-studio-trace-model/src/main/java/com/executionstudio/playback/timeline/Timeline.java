package com.executionstudio.playback.timeline;

/**
 * Manages timeline index navigation.
 *
 * <p>Responsibility: Maintain and update a step index pointer within boundaries.
 * Does not depend on execution trace structures.</p>
 */
public interface Timeline {

    /** Returns the current step index. */
    int currentIndex();

    /** Returns the index of the next step without moving the pointer. */
    int nextIndex();

    /** Returns the index of the previous step without moving the pointer. */
    int previousIndex();

    /** Returns the first index (always 0). */
    int firstIndex();

    /** Returns the last index (total steps - 1). */
    int lastIndex();

    /** Returns true if there is a next step. */
    boolean hasNext();

    /** Returns true if there is a previous step. */
    boolean hasPrevious();

    /** Moves the pointer to the target index. */
    void seek(int index);

    /** Resets the pointer to the first index. */
    void reset();
}
