export type NodeType = 'OBJECT' | 'ARRAY' | 'STRING' | 'PRIMITIVE' | 'NULL'
export type EdgeType = 'FIELD' | 'ARRAY_ELEMENT' | 'VARIABLE_REFERENCE'
export type HighlightReason = 'CURRENT' | 'CHANGED' | 'CREATED' | 'REMOVED' | 'SELECTED'
export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'EXCEPTION'

export type DisplayValueKind =
  | 'int'
  | 'long'
  | 'short'
  | 'byte'
  | 'float'
  | 'double'
  | 'boolean'
  | 'char'
  | 'string'
  | 'null'
  | 'object_ref'
  | 'array_ref'
  | 'primitive'

export interface DisplayValue {
  kind: DisplayValueKind | string
  valueString?: string
  objectId?: string
  value?: any
}

export interface VariableView {
  name: string
  declaredType: string
  value: DisplayValue
  scope: string
  changed: boolean
}

export interface FrameView {
  className: string
  methodName: string
  lineNumber: number
  locals: VariableView[]
  isActive: boolean
}

export interface StackView {
  frames: FrameView[]
}

export interface HeapObjectView {
  objectId: string
  type: 'object' | 'array'
  classNameOrType: string
  fieldsOrElements: Record<string, DisplayValue>
}

export interface HeapView {
  objects: Record<string, HeapObjectView>
}

export interface GraphNode {
  id: string
  label: string
  type: NodeType
}

export interface GraphEdge {
  source: string
  target: string
  relationshipType: EdgeType
}

export interface ReferenceGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface Highlight {
  targetId: string
  reason: HighlightReason
}

export interface HighlightState {
  currentLine: number
  currentMethod: string
  currentStackFrame: string
  activeHighlights: Highlight[]
}

export interface VisualizationModel {
  stack: StackView
  heap: HeapView
  variables: VariablesView
  graph: ReferenceGraph
  highlights: HighlightState
  status: ExecutionStatus
}

export interface VariablesView {
  variables: VariableView[]
}

import type { PlaybackMetadata } from './metadata.types'

export interface PlaybackResponse {
  model: VisualizationModel
  metadata: PlaybackMetadata
}
