import type { VisualizationModel } from './visualization.types'

export type ExecutionPhase =
  | 'PROGRAM_START'
  | 'NORMAL_LINE'
  | 'CONSTRUCTOR_ENTRY'
  | 'CONSTRUCTOR_EXIT'
  | 'METHOD_ENTRY'
  | 'METHOD_EXIT'
  | 'OBJECT_CREATED'
  | 'VARIABLE_ASSIGNED'
  | 'EXCEPTION'
  | 'PROGRAM_END'

export type PedagogicalEventType =
  | 'FRAME_PUSHED'
  | 'FRAME_POPPED'
  | 'OBJECT_ALLOCATED'
  | 'OBJECT_INITIALIZED'
  | 'REFERENCE_ASSIGNED'
  | 'VARIABLE_CREATED'
  | 'VARIABLE_UPDATED'
  | 'METHOD_CALLED'
  | 'METHOD_RETURNED'
  | 'CONSOLE_OUTPUT'
  | 'EXCEPTION_THROWN'

export interface PedagogicalEvent {
  type: PedagogicalEventType
  description: string
  details?: Record<string, unknown>
}

export interface OutputLogEvent {
  type: 'stdout' | 'stderr'
  text: string
  timestamp?: number
}

export interface StackTransitionDetails {
  callerMethod?: string
  callerClass?: string
  calleeMethod?: string
  calleeClass?: string
  isRecursion?: boolean
  returnValue?: any
}

export interface EducationalStep {
  stepIndex: number
  totalSteps: number
  highlightedLine: number
  highlightedMethod: string
  highlightedClass: string
  sourceFile: string
  executionPhase: ExecutionPhase
  executionEvents: PedagogicalEvent[]
  visualizationState: VisualizationModel
  consoleState: OutputLogEvent[]
  actionSummary: string
  transition?: StackTransitionDetails
}
