export type Point = { x: number; y: number }
export type MapViewport = { pan: Point; zoom: number }
export const MAP_NODE_WIDTH = 208
export const MAP_NODE_HEIGHT = 72
export const MIN_MAP_ZOOM = 0.2
export const MAX_MAP_ZOOM = 2

export function zoomAt(view: MapViewport, anchor: Point, nextZoom: number): MapViewport {
  const zoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, nextZoom))
  const ratio = zoom / view.zoom
  return { zoom, pan: { x: anchor.x - (anchor.x - view.pan.x) * ratio, y: anchor.y - (anchor.y - view.pan.y) * ratio } }
}

export function fitMap(points: Point[], width: number, height: number): MapViewport {
  if (!points.length || width <= 0 || height <= 0) return { zoom: 1, pan: { x: 40, y: 40 } }
  const minX = Math.min(...points.map(p => p.x)) - 24
  const minY = Math.min(...points.map(p => p.y)) - 42
  const maxX = Math.max(...points.map(p => p.x)) + MAP_NODE_WIDTH + 24
  const maxY = Math.max(...points.map(p => p.y)) + MAP_NODE_HEIGHT + 24
  const zoom = Math.max(MIN_MAP_ZOOM, Math.min(1.25, (width - 64) / (maxX - minX), (height - 80) / (maxY - minY)))
  return { zoom, pan: { x: (width - (maxX - minX) * zoom) / 2 - minX * zoom, y: (height - (maxY - minY) * zoom) / 2 - minY * zoom } }
}

/** Route arrows from the actual rectangle border, including vertical connections. */
export function mapEdge(from: Point, to: Point): { path: string; label: Point } {
  const dx = to.x - from.x, dy = to.y - from.y
  const x = from.x + MAP_NODE_WIDTH / 2, y = from.y + MAP_NODE_HEIGHT / 2
  const horizontal = Math.abs(dx) / MAP_NODE_WIDTH >= Math.abs(dy) / MAP_NODE_HEIGHT
  const sign = (horizontal ? dx : dy) >= 0 ? 1 : -1
  const start = horizontal ? { x: x + sign * MAP_NODE_WIDTH / 2, y } : { x, y: y + sign * MAP_NODE_HEIGHT / 2 }
  const end = horizontal ? { x: x + dx - sign * (MAP_NODE_WIDTH / 2 + 7), y: y + dy } : { x: x + dx, y: y + dy - sign * (MAP_NODE_HEIGHT / 2 + 7) }
  const distance = Math.max(40, Math.min(180, Math.abs(horizontal ? dx : dy) / 2))
  const c1 = horizontal ? { x: start.x + sign * distance, y: start.y } : { x: start.x, y: start.y + sign * distance }
  const c2 = horizontal ? { x: end.x - sign * distance, y: end.y } : { x: end.x, y: end.y - sign * distance }
  return { path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`, label: { x: (start.x + 3*c1.x + 3*c2.x + end.x)/8, y: (start.y + 3*c1.y + 3*c2.y + end.y)/8 } }
}
