import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotEnv } from 'dotenv'
import type { NextConfig } from 'next'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

loadDotEnv({
  path: path.resolve(currentDir, '../../.env'),
  quiet: true,
})

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
}

export default nextConfig
