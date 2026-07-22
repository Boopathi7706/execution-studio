package com.executionstudio.playback.timeline;

/**
 * Default implementation of {@link Timeline} using an integer step index pointer.
 */
public class DefaultTimeline implements Timeline {

    private final int totalEvents;
    private int currentIndex;

    public DefaultTimeline(int totalEvents) {
        if (totalEvents < 0) {
            throw new IllegalArgumentException("totalEvents must be non-negative");
        }
        this.totalEvents = totalEvents;
        this.currentIndex = 0;
    }

    @Override
    public int currentIndex() {
        return currentIndex;
    }

    @Override
    public int nextIndex() {
        if (!hasNext()) {
            return currentIndex;
        }
        return currentIndex + 1;
    }

    @Override
    public int previousIndex() {
        if (!hasPrevious()) {
            return currentIndex;
        }
        return currentIndex - 1;
    }

    @Override
    public int firstIndex() {
        return 0;
    }

    @Override
    public int lastIndex() {
        return totalEvents == 0 ? 0 : totalEvents - 1;
    }

    @Override
    public boolean hasNext() {
        return currentIndex < lastIndex();
    }

    @Override
    public boolean hasPrevious() {
        return currentIndex > firstIndex();
    }

    @Override
    public void seek(int index) {
        if (totalEvents == 0) {
            if (index != 0) {
                throw new IndexOutOfBoundsException("Empty timeline only supports index 0");
            }
            this.currentIndex = 0;
            return;
        }
        if (index < 0 || index >= totalEvents) {
            throw new IndexOutOfBoundsException(
                String.format("Seek target index %d is out of bounds [0, %d]", index, totalEvents - 1)
            );
        }
        this.currentIndex = index;
    }

    @Override
    public void reset() {
        this.currentIndex = 0;
    }
}
