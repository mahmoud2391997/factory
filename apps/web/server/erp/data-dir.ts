import path from 'node:path'

export type ErpDataDirOptions = {
  vercel: boolean
  lambda?: boolean
  configured?: string
  tmpDir: string
  cwd: string
}

export function resolveErpDataDir(options: ErpDataDirOptions) {
  if (options.vercel || options.lambda) return path.join(options.tmpDir, 'erp-data')
  const configured = options.configured?.trim()
  if (configured) return configured
  return path.join(options.cwd, 'data')
}
