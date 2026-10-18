/** @type {import('next').NextConfig} */

// Forcer la plateforme Linux pour le build (Termux/Android détecte comme 'android').
// Sans ça, Next.js essaie de charger le binaire SWC Android, qui n'existe pas.
Object.defineProperty(process, 'platform', { value: 'linux' });

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; block-all-mixed-content; upgrade-insecure-requests",
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Le site n'a aucune dependance native : rien a externaliser.
  // prisma generate tourne au build sur Vercel (Linux), pas en local sur Termux.
  experimental: {
    // Les routes API lisent la base a chaque appel : pas de mise en cache statique.
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
