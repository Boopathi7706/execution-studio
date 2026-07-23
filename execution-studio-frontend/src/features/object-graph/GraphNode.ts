export type GraphNodeType =
  | 'OBJECT'
  | 'ARRAY'
  | 'LINKED_LIST'
  | 'BINARY_TREE'
  | 'STACK'
  | 'QUEUE'
  | 'STRING'
  | 'PRIMITIVE'
  | 'NULL'

export interface GraphNode {
  id: string
  type: GraphNodeType
  classNameOrType: string
  objectId: string
  variableLabels?: string[]
  displaySummary?: string
}
