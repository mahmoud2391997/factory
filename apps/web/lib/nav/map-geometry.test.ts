import assert from 'node:assert/strict'
import test from 'node:test'
import { fitMap, mapEdge, zoomAt, MAP_NODE_WIDTH, MAP_NODE_HEIGHT } from './map-geometry'

test('zoom keeps the world point under the cursor fixed and clamps its range', () => {
  const view = { zoom: 0.5, pan: { x: 20, y: -30 } }
  const anchor = { x: 180, y: 240 }
  for (const target of [0.01, 0.7, 10]) {
    const next = zoomAt(view, anchor, target)
    assert.equal((anchor.x - next.pan.x) / next.zoom, (anchor.x - view.pan.x) / view.zoom)
    assert.equal((anchor.y - next.pan.y) / next.zoom, (anchor.y - view.pan.y) / view.zoom)
    assert.ok(next.zoom >= 0.2 && next.zoom <= 2)
  }
})

test('fit includes full node rectangles and category headings in the viewport', () => {
  const points = [{ x: -100, y: -80 }, { x: 500, y: 300 }]
  const view = fitMap(points, 900, 620)
  for (const point of points) {
    assert.ok(point.x * view.zoom + view.pan.x >= 0)
    assert.ok(point.y * view.zoom + view.pan.y >= 0)
    assert.ok((point.x + MAP_NODE_WIDTH) * view.zoom + view.pan.x <= 900)
    assert.ok((point.y + MAP_NODE_HEIGHT) * view.zoom + view.pan.y <= 620)
  }
})

test('vertical and horizontal arrows leave the correct rectangle edge', () => {
  const vertical = mapEdge({ x: 0, y: 0 }, { x: 0, y: 200 })
  assert.ok(vertical.path.startsWith(`M ${MAP_NODE_WIDTH / 2} ${MAP_NODE_HEIGHT} `))
  const horizontal = mapEdge({ x: 0, y: 0 }, { x: 400, y: 0 })
  assert.ok(horizontal.path.startsWith(`M ${MAP_NODE_WIDTH} ${MAP_NODE_HEIGHT / 2} `))
  assert.ok(Number.isFinite(vertical.label.x) && Number.isFinite(vertical.label.y))
})
