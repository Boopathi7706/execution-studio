# Execution Studio

> A Java execution visualization platform that records program execution using JDI (Java Debug Interface) and replays it through an interactive visual timeline.

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Gradle](https://img.shields.io/badge/Gradle-8.x-02303A.svg?style=flat-square&logo=gradle)](https://gradle.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [How Execution Works](#how-execution-works)
- [Screenshots](#screenshots)
- [Repository Structure](#repository-structure)
- [Getting Started & Build Instructions](#getting-started--build-instructions)
- [Completed Milestones](#completed-milestones)
- [Roadmap](#roadmap)
- [Contributing & Quality Standards](#contributing--quality-standards)
- [License](#license)

---

## Overview

### Purpose & Educational Goals
**Execution Studio** is an educational debugging and code visualization platform built to help developers, students, and educators inspect how Java programs execute step-by-step. 

Traditional debuggers display state only at a single point in time. Execution Studio launches target Java code inside an isolated debuggee JVM, records line-by-line runtime events via the **Java Debug Interface (JDI)**, and serializes the complete execution history into a structured timeline trace. Users can navigate forward and backward through program execution, inspect call stack changes, observe variable mutations, and examine heap allocations in complete visual synchronization.

### Key Problems Solved
- **Opaque Runtime State**: Demystifies how variables change across loops, method calls, and recursion.
- **Mental Model Gaps**: Visualizes stack frame pushes/pops and heap object references in lockstep with source code.
- **Non-destructive Time Travel**: Allows replaying program execution arbitrarily without restarting the debugging session.

---

## Key Features

- **Java Source Execution**: Write, edit, or paste Java code directly in the integrated Monaco Editor. Automatically extracts the primary public class name and submits it for execution.
- **JDI-Based Execution Tracing**: Runs Java code in an isolated debug JVM, stepping line-by-line (`STEP_LINE` + `STEP_INTO`) to capture local variables, stack frames, and heap allocations.
- **Asynchronous Execution & Status Polling**: Non-blocking background worker pool accepts execution requests immediately (`202 Accepted` with `executionId`) and tracks status (`QUEUED` ➔ `RUNNING` ➔ `COMPLETED` / `FAILED`).
- **Interactive Timeline Playback**: Full VCR-style player controls:
  - `⏮ First`: Jump to frame 0
  - `◀ Prev`: Step backward one execution line
  - `▶ Play / ⏸ Pause`: Animate continuous execution
  - `⏹ Stop`: Reset execution to start
  - `Next ▶`: Step forward one execution line
  - `Last ⏭`: Jump to final execution frame
  - **Speed Selector**: Playback rate adjustment (`0.25x`, `0.5x`, `1.0x`, `2.0x`, `5.0x`)
  - **Scrubber & Frame Cards**: Instant jump scrubbing across any execution frame.
- **Synchronized UI Panels**:
  - **Monaco Code Editor**: Highlights the executing source line and smooth-scrolls into view.
  - **Call Stack Panel**: Displays active JDI stack frames with method names and line numbers.
  - **Local Variables Panel**: Renders variable names, declared types, scopes, and values with type-safe formatting (`int`, `boolean`, `char`, `string`, `null`, `@objectId`).
  - **Heap Visualizer Panel**: Displays allocated objects and array elements with reference IDs.
- **Global CORS & Production Configuration**: Configured backend REST endpoints to allow seamless frontend communication across ports.

---

## System Architecture

Execution Studio is organized as a multi-module Gradle project paired with a modern React + TypeScript frontend application:

```
                                  +------------------------------+
                                  |   execution-studio-backend   |
                                  |  (Spring Boot REST / CORS)   |
                                  +--------------+---------------+
                                                 |
                                                 v
+--------------------------------+================================+-------------------------------+
|  execution-studio-trace-model  |  execution-studio-trace-engine |   execution-studio-frontend   |
|   (DTOs & Serializers)         |   (JDI / Compiler / Sessions)  |   (React 19 / Monaco / Zustand) |
+--------------------------------+================================+-------------------------------+
```

### Module Responsibilities

| Module | Responsibility |
| :--- | :--- |
| **`execution-studio-trace-model`** | Domain models (`ExecutionTrace`, `TraceEvent`, `FrameSnapshot`, `VariableSnapshot`), Jackson serializers/deserializers, and validation logic. |
| **`execution-studio-trace-engine`** | Java compiler integration (`ToolProvider`), JDI debuggee launcher (`JdiDebugSession`), line capture strategies, and thread event handling. |
| **`execution-studio-backend`** | Spring Boot REST controllers (`TraceController`, `HealthController`), `ExecutionManager` background worker pool, `StorageService`, and global CORS configuration. |
| **`execution-studio-frontend`** | React 19 SPA built with Vite, TypeScript, Monaco Editor, Zustand state store, Axios API client, and debugger UI panels. |

---

## Technology Stack

### Backend
- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot 3.x
- **Build System**: Gradle 8.x (Kotlin DSL)
- **Tracing**: Java Debug Interface (JDI) via `com.sun.jdi`
- **Serialization**: Jackson JSON Databind

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 6.x
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

---

## How Execution Works

```
[ User Clicks 'Run Code' ]
          │
          ▼
1. Extract Class Name & Source
          │
          ▼
2. POST /api/v1/traces ───► Backend accepts & returns executionId (202 Accepted)
          │
          ▼
3. Poll GET /api/v1/traces/{id} ◄── Polling every 500ms (QUEUED -> RUNNING -> COMPLETED)
          │
          ▼
4. Target Compilation & Launch JDI ──► Target Java file compiled & launched in target debuggee VM
          │
          ▼
5. JDI Step Event Loop ──► Captures line events, stack frames, variables & heap snapshots
          │
          ▼
6. Serialized Trace JSON ──► Complete trace written & returned to frontend
          │
          ▼
7. Load into Zustand Store ──► `currentFrameIndex` updated
          │
          ▼
8. Synchronized UI Update:
   ├── Highlight Monaco Line
   ├── Update Call Stack Panel
   ├── Update Local Variables Table
   └── Render Heap Cards
```

---

## Screenshots

*(Screenshots can be added below as visual documentation updates occur)*

### Code Editor & Execution Trigger
<!-- ![Editor Placeholder](docs/screenshots/editor.png) -->
*Monaco Editor with active line highlight decoration and execution status badge.*

### Playback Controls & Timeline
<!-- ![Timeline Placeholder](docs/screenshots/timeline.png) -->
*Interactive player control bar with scrubber slider, playback rate selector, and frame cards.*

### Call Stack & Variables Panels
<!-- ![Variables Placeholder](docs/screenshots/variables.png) -->
*Debug inspect panels showing active thread stack frames and type-formatted local variables.*

### Heap Object Snapshot Visualizer
<!-- ![Heap Placeholder](docs/screenshots/heap.png) -->
*Allocated objects and array elements with reference identifiers.*

---

## Repository Structure

```text
Execution Studio/
├── build.gradle.kts
├── settings.gradle.kts
├── gradlew
├── gradlew.bat
├── execution-studio-trace-model/
│   └── src/main/java/com/executionstudio/
│       ├── model/             # TraceEvent, ExecutionTrace, FrameSnapshot
│       └── serializer/        # Jackson trace serializers & loaders
├── execution-studio-trace-engine/
│   └── src/main/java/com/executionstudio/
│       ├── compiler/          # In-memory Java compiler wrappers
│       ├── jdi/               # Line-level capture strategies
│       ├── launcher/          # JdiDebugSession debuggee process runner
│       └── service/           # DefaultTraceEngine implementation
├── execution-studio-backend/
│   └── src/main/java/com/executionstudio/backend/
│       ├── config/            # CorsConfig (WebMvcConfigurer)
│       ├── controller/        # TraceController, HealthController
│       ├── dto/               # TraceRequestDto, TraceStatusResponse
│       ├── manager/           # ExecutionManager & ExecutionSession
│       └── service/           # TraceExecutionService & StorageService
└── execution-studio-frontend/
    ├── src/
    │   ├── api/               # Axios client & trace API service
    │   ├── components/        # Shell layout, panels, badges
    │   ├── features/
    │   │   ├── source-viewer/ # MonacoWrapper & SourceViewerPanel
    │   │   ├── timeline/      # TimelinePanel & playback controls
    │   │   ├── stack/         # CallStackPanel & FrameCard
    │   │   ├── variables/     # VariablesPanel & VariableRow / VariableValue
    │   │   └── heap/          # HeapViewContainer & HeapCard
    │   ├── hooks/             # useExecuteTrace, useTracePolling, usePlayback
    │   ├── store/             # useAppStore, usePlaybackStore (Zustand)
    │   └── utils/             # classNameParser utility
    ├── package.json
    └── vite.config.ts
```

---

## Getting Started & Build Instructions

### Prerequisites
- **Java JDK 21** or higher
- **Node.js 18+** & `npm`
- **Windows / macOS / Linux**

### 1. Backend Setup & Run

Clone the repository and run the Spring Boot backend service:

```bash
# Build the multi-module project
./gradlew.bat build

# Launch the Spring Boot backend server on http://localhost:8080
./gradlew.bat :execution-studio-backend:bootRun
```

To run all backend unit and integration tests:

```bash
./gradlew.bat test
```

### 2. Frontend Setup & Run

Navigate to the frontend module and start the Vite development server:

```bash
cd execution-studio-frontend

# Install dependencies
npm install

# Start Vite dev server on http://localhost:5173
npm run dev
```

To run the Vitest test suite (69+ unit & integration tests):

```bash
npm run test
```

To create a production build:

```bash
npm run build
```

---

## Completed Milestones

- [x] **Milestone 1: Domain Model & Serializer**: Defined JSON trace schema, line events, frame snapshots, variable snapshots, and Jackson serializers.
- [x] **Milestone 2: Trace Engine & JDI Launcher**: Built `JdiDebugSession` with JDI event handling (`StepEvent`, `ClassPrepareEvent`, `VMDeathEvent`), event request management, and target compiler integration.
- [x] **Milestone 3: Asynchronous REST Service & Storage**: Created Spring Boot backend REST endpoints (`POST /api/v1/traces`, `GET /api/v1/traces/{id}`), `ExecutionManager` background worker pool, `StorageService`, and global CORS configuration.
- [x] **Milestone 4.1: Frontend Foundation**: Created React 19 + TypeScript + Vite project shell, Zustand stores, Axios client, health indicator, Monaco wrapper, and visual panel components.
- [x] **Milestone 4.2: Trace Execution & Playback Integration**: Wired end-to-end code execution, REST status polling, timeline loading, VCR player controls, Monaco active line highlighting, and synchronized stack/variable/heap debugger views.

---

## Roadmap

Future planned features for Execution Studio:

- [ ] **Object Graph Visualization**: Interactive graph view rendering object reference edges using Cytoscape.js.
- [ ] **Array Memory Layout Visualizer**: Specialized visualizer displaying array elements, indices, and memory bounds.
- [ ] **Breakpoints & Conditional Debugging**: Allow setting breakpoints in Monaco Editor to pause execution at specific lines.
- [ ] **Step Into / Step Over Live Debugging**: Real-time live execution control without full pre-recording.
- [ ] **Time-travel State Comparison**: Visual diffing showing modified variables and newly allocated objects between steps.
- [ ] **Algorithm Visualization Templates**: Pre-configured interactive examples for sorting, data structures, and recursion.
- [ ] **Multi-threaded Concurrency Support**: Track and visualize multiple active threads executing simultaneously.

---

## Contributing & Quality Standards

Contributions are welcome! Please adhere to the following standards:

1. **Strict Typing**: No `any` types in TypeScript. Maintain explicit interfaces for backend DTOs.
2. **SOLID Principles**: Keep components focused, UI state separated from API logic via custom hooks, and state managed through Zustand stores.
3. **Automated Testing**: Ensure all unit and integration tests pass cleanly (`./gradlew test` and `npm run test`) before submitting pull requests.

---

## License

This project is licensed under the [MIT License](LICENSE).
