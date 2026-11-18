import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.kancuno.com/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://www.kancuno.com/klab', changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://www.kancuno.com/klab/editor', changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://www.kancuno.com/klab/pixel', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/klab/animate', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/klab/svg', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://www.kancuno.com/klab/touch', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/klab/wrap', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.kancuno.com/llms.txt', changeFrequency: 'weekly', priority: 0.5 },
  ]
}
