import type { MetadataRoute } from 'next'

// Open to every crawler, AI assistants included, so the facts about
// NEONFACES and THE100 are indexed and quotable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://www.kancuno.com/sitemap.xml',
    host: 'https://www.kancuno.com',
  }
}
