package com.executionstudio.launcher;

import com.executionstudio.error.LaunchFailure;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * JDI-based runtime launcher using {@code LaunchingConnector}.
 *
 * <p>Launches the debuggee JVM suspended at startup via the standard
 * "com.sun.jdi.CommandLineLaunch" connector.</p>
 */
public class JdiRuntimeLauncher implements RuntimeLauncher {

    private static final Logger log = LoggerFactory.getLogger(JdiRuntimeLauncher.class);

    @Override
    public DebugSession launch(String mainClass, Path classDir, List<String> allClassNames)
            throws LaunchFailure {

        log.info("Launching debuggee: mainClass={}, classDir={}", mainClass, classDir);

        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> arguments = connector.defaultArguments();

        // Set the main class
        Connector.Argument mainArg = arguments.get("main");
        if (mainArg == null) {
            throw new LaunchFailure("LaunchingConnector has no 'main' argument", mainClass);
        }
        mainArg.setValue(mainClass);

        // Set classpath to include the output directory
        Connector.Argument optionsArg = arguments.get("options");
        if (optionsArg != null) {
            optionsArg.setValue("-cp \"" + classDir.toAbsolutePath() + "\"");
        }

        try {
            VirtualMachine vm = connector.launch(arguments);
            log.info("Debuggee VM launched (suspended)");

            Set<String> userClasses = Set.copyOf(allClassNames);
            return new JdiDebugSession(vm, userClasses);

        } catch (Exception e) {
            throw new LaunchFailure(
                "Failed to launch debuggee: " + e.getMessage(), mainClass, e);
        }
    }
}
