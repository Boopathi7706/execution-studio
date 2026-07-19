export interface Point2D {
  x: number
  y: number
}

export interface LayoutModel {
  positions: Record<string, Point2D>
}
