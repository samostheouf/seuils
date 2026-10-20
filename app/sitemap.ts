import type { MetadataRoute } from 'next';

const BASE = 'https://seuils-virid.vercel.app';

// Le sitemap doit contenir TOUTE page du site, pas seulement les endpoints API.
// Une page HTML absente du sitemap est une page que Google ne découvrira pas :
// le sitemap est la seule déclaration de routes du projet.
//
// Règle : chaque page ajoutée dans app/ doit apparaître ici. Un test (scripts/
// audit-seuils.py) refuse le score complet si une page HTML du site manque.
const PAGES_HTML: { chemin: string; priorite: number; frequence: 'monthly' | 'weekly' }[] = [
  { chemin: '/', priorite: 1, frequence: 'weekly' },
  { chemin: '/formation', priorite: 0.7, frequence: 'monthly' },
  { chemin: '/formation/modules/1', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/formation/modules/2', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/formation/modules/3', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/formation/modules/4', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/formation/modules/5', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/formation/quiz/1', priorite: 0.4, frequence: 'monthly' },
  { chemin: '/formation/quiz/2', priorite: 0.4, frequence: 'monthly' },
  { chemin: '/formation/quiz/3', priorite: 0.4, frequence: 'monthly' },
  { chemin: '/formation/quiz/4', priorite: 0.4, frequence: 'monthly' },
  { chemin: '/formation/quiz/5', priorite: 0.4, frequence: 'monthly' },
  { chemin: '/formation/certificat', priorite: 0.4, frequence: 'monthly' },
];

const ENDPOINTS_API = [
  { chemin: '/api/v1/parametres.json', priorite: 0.8 },
  { chemin: '/api/v1/changelog.json', priorite: 0.8 },
  { chemin: '/api/v1/sources.json', priorite: 0.6 },
  { chemin: '/api/v1/parametres.csv', priorite: 0.7 },
  { chemin: '/api/v1/historique.json', priorite: 0.8 },
  { chemin: '/api/v1/tva.json', priorite: 0.7 },
  { chemin: '/api/v1/acre.json', priorite: 0.7 },
  { chemin: '/api/v1/drom.json', priorite: 0.6 },
  { chemin: '/api/v1/csv', priorite: 0.6 },
  { chemin: '/feed', priorite: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();
  return [
    ...PAGES_HTML.map((p) => ({
      url: `${BASE}${p.chemin}`,
      lastModified: maintenant,
      changeFrequency: p.frequence,
      priority: p.priorite,
    })),
    ...ENDPOINTS_API.map((e) => ({
      url: `${BASE}${e.chemin}`,
      lastModified: maintenant,
      changeFrequency: 'weekly' as const,
      priority: e.priorite,
    })),
  ];
}
