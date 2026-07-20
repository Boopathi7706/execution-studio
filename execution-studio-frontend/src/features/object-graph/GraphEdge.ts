export interface GraphEdge {
  id: string
  source: string // parent objectId
  target: string // child objectId
  fieldName: string
}
