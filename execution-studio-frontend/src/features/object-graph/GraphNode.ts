export type GraphNodeType = 'OBJECT' | 'ARRAY' | 'STRING' | 'PRIMITIVE' | 'NULL'

export interface GraphNode {
  id: string
  type: GraphNodeType
  classNameOrType: string
  objectId: string
}
