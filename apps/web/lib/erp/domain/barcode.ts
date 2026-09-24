/** CODE128-B patterns (ISO/IEC 15417). Index 106 is the stop symbol. */
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

const START_B = 104

export function code128Values(value: string) {
  const text = value.trim()
  if (!text) throw new Error('فارغ')
  const codes = [START_B]
  for (const char of text) {
    const code = char.charCodeAt(0) - 32
    if (code < 0 || code > 94) throw new Error('الرمز يدعم الأحرف الإنجليزية والأرقام فقط')
    codes.push(code)
  }
  let checksum = START_B
  for (let index = 1; index < codes.length; index += 1) checksum += codes[index]! * index
  codes.push(checksum % 103)
  codes.push(106)
  return codes
}

export function barcodeSvg(value: string, options?: { height?: number; module?: number }) {
  const codes = code128Values(value)
  const moduleWidth = options?.module ?? 2
  const height = options?.height ?? 70
  const quiet = moduleWidth * 10
  let x = quiet
  const rects: string[] = []
  for (const code of codes) {
    const pattern = PATTERNS[code]
    if (!pattern) throw new Error('نمط باركود غير معروف')
    let bar = true
    for (const digit of pattern) {
      const width = Number(digit) * moduleWidth
      if (bar) rects.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#111"/>`)
      x += width
      bar = !bar
    }
  }
  const width = x + quiet
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + 22}" width="${width}" height="${height + 22}" role="img" aria-label="${value}">${rects.join('')}<text x="${width / 2}" y="${height + 16}" text-anchor="middle" font-family="ui-sans-serif, sans-serif" font-size="14" fill="#111">${value}</text></svg>`
}
