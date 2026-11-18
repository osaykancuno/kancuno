import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.kancuno.com/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://www.kancuno.com/lab', changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://www.kancuno.com/lab/editor', changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://www.kancuno.com/lab/pixel', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/lab/animate', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/lab/svg', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://www.kancuno.com/lab/touch', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/lab/wrap', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/llms.txt', changeFrequency: 'weekly', priority: 0.5 },
  ]
}
