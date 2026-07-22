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
 * JDI debug session implementation — with comprehensive JDI event flow instrumentation.
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
        log.info("[INSTRUMENTATION] Starting debug session, user classes: {}", userClasses);

        try {
            EventRequestManager erm = vm.eventRequestManager();

            for (String className : userClasses) {
                ClassPrepareRequest cpr = erm.createClassPrepareRequest();
                cpr.addClassFilter(className);
                cpr.enable();
                log.info("[INSTRUMENTATION] ClassPrepareRequest enabled for class filter: {}", className);
            }

            ExceptionRequest exReq = erm.createExceptionRequest(null, false, true);
            exReq.enable();
            log.info("[INSTRUMENTATION] Uncaught ExceptionRequest enabled");

            log.info("[INSTRUMENTATION] Calling vm.resume()");
            vm.resume();

            EventQueue queue = vm.eventQueue();
            boolean running = true;

            while (running && !terminated) {
                EventSet eventSet;
                try {
                    eventSet = queue.remove(100);
                } catch (InterruptedException e) {
                    log.info("[INSTRUMENTATION] EventQueue.remove interrupted");
                    Thread.currentThread().interrupt();
                    break;
                }

                if (eventSet == null) {
                    if (watchdog.isExceeded()) {
                        terminationReason = watchdog.terminationReason();
                        log.warn("[INSTRUMENTATION] Watchdog triggered on event poll timeout: {}", terminationReason);
                        terminate();
                        break;
                    }
                    continue;
                }

                for (Event event : eventSet) {
                    log.info("[INSTRUMENTATION] JDI Event Received: {} | Class: {}", event.getClass().getSimpleName(), event.getClass().getName());

                    if (event instanceof VMStartEvent vse) {
                        log.info("[INSTRUMENTATION] VMStartEvent received on thread: {}", vse.thread() != null ? vse.thread().name() : "null");
                    } else if (event instanceof ClassPrepareEvent cpe) {
                        log.info("[INSTRUMENTATION] ClassPrepareEvent received for class: {}, thread: {}", cpe.referenceType().name(), cpe.thread().name());
                        handleClassPrepare(cpe, erm);
                    } else if (event instanceof StepEvent se) {
                        Location loc = se.location();
                        log.info("[INSTRUMENTATION] StepEvent received | Class: {} | Method: {} | Line: {} | Thread: {}",
                            loc.declaringType().name(), loc.method().name(), loc.lineNumber(), se.thread().name());
                        running = handleStep(se, strategy, watchdog, erm);
                    } else if (event instanceof MethodEntryEvent mee) {
                        log.info("[INSTRUMENTATION] MethodEntryEvent received | Method: {} | Thread: {}", mee.method().name(), mee.thread().name());
                    } else if (event instanceof MethodExitEvent mxe) {
                        log.info("[INSTRUMENTATION] MethodExitEvent received | Method: {} | Thread: {}", mxe.method().name(), mxe.thread().name());
                    } else if (event instanceof BreakpointEvent bpe) {
                        log.info("[INSTRUMENTATION] BreakpointEvent received at location: {}", bpe.location());
                    } else if (event instanceof ThreadStartEvent tse) {
                        log.info("[INSTRUMENTATION] ThreadStartEvent received for thread: {}", tse.thread().name());
                    } else if (event instanceof ThreadDeathEvent tde) {
                        log.info("[INSTRUMENTATION] ThreadDeathEvent received for thread: {}", tde.thread().name());
                    } else if (event instanceof ExceptionEvent ee) {
                        log.info("[INSTRUMENTATION] ExceptionEvent received at location: {} | Thread: {}", ee.location(), ee.thread().name());
                        handleException(ee, strategy);
                        running = false;
                    } else if (event instanceof VMDeathEvent) {
                        log.info("[INSTRUMENTATION] VMDeathEvent received");
                        strategy.onVMDeath();
                        running = false;
                    } else if (event instanceof VMDisconnectEvent) {
                        log.info("[INSTRUMENTATION] VMDisconnectEvent received");
                        running = false;
                    }
                }

                if (running) {
                    log.info("[INSTRUMENTATION] Calling eventSet.resume()");
                    eventSet.resume();
                }
            }

        } catch (VMDisconnectedException e) {
            log.info("[INSTRUMENTATION] VMDisconnectedException caught in event loop");
        } catch (Exception e) {
            log.error("[INSTRUMENTATION] Error in debug session event loop: {}", e.getMessage(), e);
        }
    }

    private void handleClassPrepare(ClassPrepareEvent event, EventRequestManager erm) {
        String className = event.referenceType().name();
        ThreadReference thread = event.thread();
        log.info("[INSTRUMENTATION] Handling ClassPrepareEvent for class: {}, thread id: {}, thread name: {}",
            className, thread.uniqueID(), thread.name());

        // Log existing step requests deletion
        erm.stepRequests().stream()
            .filter(sr -> sr.thread().equals(thread))
            .forEach(sr -> {
                log.info("[INSTRUMENTATION] Deleting existing StepRequest for thread id: {}, name: {}", thread.uniqueID(), thread.name());
                erm.deleteEventRequest(sr);
            });

        StepRequest stepRequest = createAndEnableStepRequest(thread, erm);
        log.info("[INSTRUMENTATION] Created initial StepRequest for ClassPrepareEvent | Thread ID: {} | Thread Name: {} | Suspend Policy: {} | Step Size: STEP_LINE | Step Depth: STEP_INTO | Enabled: {}",
            thread.uniqueID(), thread.name(), stepRequest.suspendPolicy(), stepRequest.isEnabled());
    }

    private boolean handleStep(StepEvent event, CaptureStrategy strategy,
                                Watchdog watchdog, EventRequestManager erm) {
        Location location = event.location();
        String className = location.declaringType().name();

        if (!isUserClass(className)) {
            log.info("[INSTRUMENTATION] StepEvent location is not a user class ({}), skipping capture & re-enabling StepRequest", className);
            reEnableStepRequest(event, erm);
            return true;
        }

        strategy.onStep(new StepContext(event.thread(), location));
        watchdog.recordStep();

        if (watchdog.isExceeded()) {
            terminationReason = watchdog.terminationReason();
            log.warn("[INSTRUMENTATION] Watchdog triggered after step count exceeded: {}", terminationReason);
            terminate();
            return false;
        }

        reEnableStepRequest(event, erm);
        return true;
    }

    private void reEnableStepRequest(StepEvent event, EventRequestManager erm) {
        try {
            ThreadReference thread = event.thread();
            log.info("[INSTRUMENTATION] Re-enabling StepRequest for thread id: {}, name: {}", thread.uniqueID(), thread.name());

            erm.stepRequests().stream()
                .filter(sr -> sr.thread().equals(thread))
                .forEach(sr -> {
                    log.info("[INSTRUMENTATION] Deleting previous StepRequest for thread id: {}, name: {}", thread.uniqueID(), thread.name());
                    erm.deleteEventRequest(sr);
                });

            StepRequest stepRequest = createAndEnableStepRequest(thread, erm);
            log.info("[INSTRUMENTATION] Re-created StepRequest | Thread ID: {} | Thread Name: {} | Suspend Policy: {} | Step Size: STEP_LINE | Step Depth: STEP_INTO | Enabled: {}",
                thread.uniqueID(), thread.name(), stepRequest.suspendPolicy(), stepRequest.isEnabled());
        } catch (Exception e) {
            log.error("[INSTRUMENTATION] Failed to recreate StepRequest: {}", e.getMessage(), e);
        }
    }

    private StepRequest createAndEnableStepRequest(ThreadReference thread, EventRequestManager erm) {
        StepRequest stepRequest = erm.createStepRequest(
            thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO
        );
        stepRequest.addClassExclusionFilter("java.*");
        stepRequest.addClassExclusionFilter("javax.*");
        stepRequest.addClassExclusionFilter("sun.*");
        stepRequest.addClassExclusionFilter("jdk.*");
        stepRequest.addClassExclusionFilter("com.sun.*");
        stepRequest.enable();
        return stepRequest;
    }

    private void handleException(ExceptionEvent event, CaptureStrategy strategy) {
        Location location = event.location();
        if (location != null) {
            terminationReason = "uncaught_exception";
            log.info("[INSTRUMENTATION] Handling ExceptionEvent at {}:{}", location.declaringType().name(), location.lineNumber());
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
                log.info("[INSTRUMENTATION] Terminating debuggee VM with vm.exit(1)");
                vm.exit(1);
            } catch (VMDisconnectedException e) {
                log.debug("[INSTRUMENTATION] VM already disconnected during terminate");
            } catch (Exception e) {
                log.warn("[INSTRUMENTATION] Error terminating VM: {}", e.getMessage());
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
