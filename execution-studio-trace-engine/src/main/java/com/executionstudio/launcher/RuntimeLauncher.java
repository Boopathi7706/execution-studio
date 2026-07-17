package com.executionstudio.launcher;

import com.executionstudio.error.LaunchFailure;

import java.nio.file.Path;
import java.util.List;

/**
 * Launches a debuggee JVM and returns a debug session.
 *
 * <p><b>Responsibility:</b> Start a new JVM process with debug wire protocol enabled,
 * suspended at startup, and return a connected {@link DebugSession}.</p>
 *
 * <p><b>Preconditions:</b></p>
 * <ul>
 *   <li>mainClass is a valid class name with a main(String[]) method.</li>
 *   <li>classDir contains the compiled .class files.</li>
 *   <li>allClassNames lists all user-defined classes from the compilation.</li>
 * </ul>
 *
 * <p><b>Postconditions:</b></p>
 * <ul>
 *   <li>A suspended debuggee JVM is running.</li>
 *   <li>The returned DebugSession is connected and ready for run().</li>
 * </ul>
 *
 * <p><b>Thread Safety:</b> Not thread-safe. Single-use per invocation.</p>
 * <p><b>Ownership:</b> Caller owns the returned DebugSession and must close() it.</p>
 * <p><b>Failure Conditions:</b> Throws {@link LaunchFailure} if the JVM cannot be
 * started or the JDI connection fails.</p>
 */
public interface RuntimeLauncher {

    /**
     * Launch a debuggee JVM.
     *
     * @param mainClass     the main class to execute
     * @param classDir      the directory containing .class files
     * @param allClassNames all user-defined class names for filtering
     * @return a connected, suspended debug session
     * @throws LaunchFailure if the launch fails
     */
    DebugSession launch(String mainClass, Path classDir, List<String> allClassNames)
        throws LaunchFailure;
}
