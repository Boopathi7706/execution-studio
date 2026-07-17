package com.executionstudio.launcher;

import com.executionstudio.jdi.capture.CaptureStrategy;
import com.executionstudio.jdi.capture.ExceptionContext;
import com.executionstudio.jdi.capture.StepContext;
import com.executionstudio.watchdog.Watchdog;
import com.sun.jdi.*;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;

/**
 * JDI debug session implementation — the core event loop.
 *
 * <p>Processes JDI events: ClassPrepareEvent, StepEvent, ExceptionEvent, VMDeathEvent.
 * Filters to user-defined classes only (skipping JDK internals).
 * Manages StepRequest lifecycle and integrates with the watchdog for termination.</p>
 */
public class JdiDebugSession implements DebugSession {

    private static final Logger log = LoggerFactory.getLogger(JdiDebugSession.class);

    private final VirtualMachine vm;
    private final Set<String> userClasses;
    private volatile String terminationReason = "normal_exit";
    private volatile boolean terminated = false;

    public JdiDebugSession(VirtualMachine vm, Set<String> userClasses) {
        this.vm = vm;
        this.userClasses = userClasses;
    }

    @Override
    public void run(CaptureStrategy strategy, Watchdog watchdog) {
        log.info("Starting debug session, user classes: {}", userClasses);

        try {
            // Set up event requests
            EventRequestManager erm = vm.eventRequestManager();

            // Request ClassPrepareEvents for user classes to set up stepping
            for (String className : userClasses) {
                ClassPrepareRequest cpr = erm.createClassPrepareRequest();
                cpr.addClassFilter(className);
                cpr.enable();
            }

            // Request to be notified of uncaught exceptions
            ExceptionRequest exReq = erm.createExceptionRequest(null, false, true);
            exReq.enable();

            // Start the VM
            vm.resume();

            // Event loop
            EventQueue queue = vm.eventQueue();
            boolean running = true;

            while (running && !terminated) {
                EventSet eventSet;
                try {
                    eventSet = queue.remove(100); // 100ms timeout to check watchdog
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }

                if (eventSet == null) {
                    // Check watchdog on timeout
                    if (watchdog.isExceeded()) {
                        terminationReason = watchdog.terminationReason();
                        log.warn("Watchdog triggered: {}", terminationReason);
                        terminate();
                        break;
                    }
                    continue;
                }

                for (Event event : eventSet) {
                    if (event instanceof ClassPrepareEvent cpe) {
                        handleClassPrepare(cpe, erm);
                    } else if (event instanceof StepEvent se) {
                        running = handleStep(se, strategy, watchdog, erm);
                    } else if (event instanceof ExceptionEvent ee) {
                        handleException(ee, strategy);
                        running = false;
                    } else if (event instanceof VMDeathEvent) {
                        log.info("VM death event received");
                        strategy.onVMDeath();
                        running = false;
                    } else if (event instanceof VMDisconnectEvent) {
                        log.info("VM disconnect event received");
                        running = false;
                    }
                }

                if (running) {
                    eventSet.resume();
                }
            }

        } catch (VMDisconnectedException e) {
            log.info("VM disconnected");
        } catch (Exception e) {
            log.error("Error in debug session event loop: {}", e.getMessage(), e);
        }
    }

    private void handleClassPrepare(ClassPrepareEvent event, EventRequestManager erm) {
        String className = event.referenceType().name();
        log.debug("Class prepared: {}", className);

        // Create a step request for the main thread when we see the first user class
        ThreadReference thread = event.thread();

        // Delete any existing step requests for this thread
        erm.stepRequests().stream()
            .filter(sr -> sr.thread().equals(thread))
            .forEach(erm::deleteEventRequest);

        // Create new step request: STEP_LINE + STEP_INTO to follow all method calls
        StepRequest stepRequest = erm.createStepRequest(
            thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO
        );

        // Add class exclusion filters to skip JDK internals
        stepRequest.addClassExclusionFilter("java.*");
        stepRequest.addClassExclusionFilter("javax.*");
        stepRequest.addClassExclusionFilter("sun.*");
        stepRequest.addClassExclusionFilter("jdk.*");
        stepRequest.addClassExclusionFilter("com.sun.*");

        stepRequest.enable();
        log.debug("Step request created for thread: {}", thread.name());
    }

    private boolean handleStep(StepEvent event, CaptureStrategy strategy,
                                Watchdog watchdog, EventRequestManager erm) {
        Location location = event.location();
        String className = location.declaringType().name();

        // Double-check: only process user classes
        if (!isUserClass(className)) {
            return true; // Skip but continue
        }

        // Dispatch to capture strategy
        strategy.onStep(new StepContext(event.thread(), location));
        watchdog.recordStep();

        // Check watchdog after each step
        if (watchdog.isExceeded()) {
            terminationReason = watchdog.terminationReason();
            log.warn("Watchdog triggered after step: {}", terminationReason);
            terminate();
            return false;
        }

        return true;
    }

    private void handleException(ExceptionEvent event, CaptureStrategy strategy) {
        Location location = event.location();
        if (location != null) {
            terminationReason = "uncaught_exception";
            strategy.onException(new ExceptionContext(
                event.thread(), location, event.exception()));
        }
    }

    private boolean isUserClass(String className) {
        return userClasses.contains(className);
    }

    @Override
    public void terminate() {
        if (!terminated) {
            terminated = true;
            try {
                vm.exit(1);
                log.info("Debuggee VM terminated");
            } catch (VMDisconnectedException e) {
                log.debug("VM already disconnected during terminate");
            } catch (Exception e) {
                log.warn("Error terminating VM: {}", e.getMessage());
            }
        }
    }

    @Override
    public String getTerminationReason() {
        return terminationReason;
    }

    @Override
    public void close() {
        terminate();
    }
}
