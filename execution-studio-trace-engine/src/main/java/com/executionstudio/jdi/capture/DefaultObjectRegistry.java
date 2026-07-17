package com.executionstudio.jdi.capture;

import java.util.HashMap;
import java.util.Map;

/**
 * Default implementation of {@link ObjectRegistry}.
 *
 * <p>Uses a simple HashMap with a monotonic counter to assign "obj_1", "obj_2", etc.
 * IDs are stable: the same JDI uniqueID always maps to the same synthetic ID.</p>
 */
public class DefaultObjectRegistry implements ObjectRegistry {

    private final Map<Long, String> idMap = new HashMap<>();
    private int counter = 0;

    @Override
    public String getOrAssignId(long jdiUniqueId) {
        return idMap.computeIfAbsent(jdiUniqueId, id -> {
            counter++;
            return "obj_" + counter;
        });
    }

    @Override
    public boolean isKnown(long jdiUniqueId) {
        return idMap.containsKey(jdiUniqueId);
    }

    @Override
    public int totalObjects() {
        return idMap.size();
    }
}
