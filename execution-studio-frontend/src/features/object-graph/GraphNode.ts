export interface GraphNode {
  id: string
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'PRIMITIVE' | 'NULL'
  classNameOrType: string
  objectId: string
}
