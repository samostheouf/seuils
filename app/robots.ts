import type { MetadataRoute } from 'next';

const BASE = 'https://seuils-virid.vercel.app';

// Règle : un chemin listé dans le sitemap ne doit PAS être désindexé par robots.
// `Allow: '/'` seul est trop faible : il laisse le doute sur les sous-chemins,
// et un chemin à la fois dans le sitemap et bloqué par robots est une
// contradiction que les moteurs signalent.
//
// Le certificat de complétion est une page à usage unique : elle n'a pas à être
// indexée (elle n'apporte rien au référencement du sujet).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/formation/certificat'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
