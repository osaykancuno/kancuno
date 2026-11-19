import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // this folder is the project root (a stray lockfile higher up must not be taken for it)
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // THE K.LAB moved from /lab to /klab (2026-11-18). The K1N0 contract writes
  // kancuno.com/lab/token?id=N into every token's metadata for good, and links were
  // already shared: keep them all working with permanent redirects (the query string
  // carries over).
  async redirects() {
    return [
      { source: '/lab', destination: '/klab', permanent: true },
      { source: '/lab/:path*', destination: '/klab/:path*', permanent: true },
    ]
  },
}

export default nextConfig
