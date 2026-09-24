/** Omani rial uses 3 decimal places (1 OMR = 1000 baisa). */

export function round3(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

export function money(value: number): number {
  return round3(value)
}

export function qty(value: number): number {
  return round3(value)
}

export function almostEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon
}
