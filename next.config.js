/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le site n'a aucune dependance native : rien a externaliser.
  // prisma generate tourne au build sur Vercel (Linux), pas en local sur Termux.
  experimental: {
    // Les routes API lisent la base a chaque appel : pas de mise en cache statique.
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;
