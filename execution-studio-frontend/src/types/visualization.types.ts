export type NodeType = 'OBJECT' | 'ARRAY' | 'STRING' | 'PRIMITIVE' | 'NULL'
export type EdgeType = 'FIELD' | 'ARRAY_ELEMENT' | 'VARIABLE_REFERENCE'
export type HighlightReason = 'CURRENT' | 'CHANGED' | 'CREATED' | 'REMOVED' | 'SELECTED'
export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'EXCEPTION'

export interface DisplayValue {
  kind: 'primitive' | 'object_ref' | 'array_ref' | 'string' | 'null'
  valueString?: string
  objectId?: string
  value?: string
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
