import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.kancuno.com/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://www.kancuno.com/llms.txt', changeFrequency: 'weekly', priority: 0.5 },
  ]
}
