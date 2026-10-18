import type { MetadataRoute } from 'next';

const BASE = 'https://seuils-virid.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();
  return [
    { url: `${BASE}/`, lastModified: maintenant, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/api/v1/parametres.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/api/v1/changelog.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/api/v1/sources.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/api/v1/parametres.csv`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/api/v1/historique.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/api/v1/tva.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/api/v1/acre.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/api/v1/drom.json`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/api/v1/csv`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/feed`, lastModified: maintenant, changeFrequency: 'daily', priority: 0.5 },
  ];
}
