package com.executionstudio.statistics;

import com.executionstudio.runtime.events.RuntimeEvent;
import com.executionstudio.trace.model.TraceStatistics;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Default implementation of {@link StatisticsCollector}.
 *
 * <p>Tracks event counts, object/array creation counts, max call stack depth,
 * unique methods executed, and approximate loop iterations (detected by
 * the same line being visited more than once).</p>
 */
public class DefaultStatisticsCollector implements StatisticsCollector {

    private int eventCount = 0;
    private int objectsCreated = 0;
    private int arraysCreated = 0;
    private int maxStackDepth = 0;
    private final Set<String> methodsSeen = new HashSet<>();
    private final Map<String, Integer> lineVisitCounts = new HashMap<>();
    private boolean built = false;

    @Override
    public void recordEvent(RuntimeEvent event) {
        checkNotBuilt();
        eventCount++;
    }

    @Override
    public void recordObjectCreated() {
        checkNotBuilt();
        objectsCreated++;
    }

    @Override
    public void recordArrayCreated() {
        checkNotBuilt();
        arraysCreated++;
    }

    @Override
    public void recordStackDepth(int depth) {
        checkNotBuilt();
        maxStackDepth = Math.max(maxStackDepth, depth);
    }

    @Override
    public void recordMethodSeen(String methodSignature) {
        checkNotBuilt();
        methodsSeen.add(methodSignature);
    }

    @Override
    public void recordLineVisit(String className, int lineNumber) {
        checkNotBuilt();
        String key = className + ":" + lineNumber;
        lineVisitCounts.merge(key, 1, Integer::sum);
    }

    @Override
    public TraceStatistics build() {
        built = true;
        // Loop iterations = total re-visits (visits beyond the first) of any line
        int loopIterations = lineVisitCounts.values().stream()
            .filter(count -> count > 1)
            .mapToInt(count -> count - 1)
            .sum();

        return new TraceStatistics(
            maxStackDepth,
            methodsSeen.size(),
            loopIterations,
            objectsCreated,
            arraysCreated
        );
    }

    private void checkNotBuilt() {
        if (built) {
            throw new IllegalStateException("StatisticsCollector has already been built");
        }
    }
}
