// Resource hints pour pré-connecter le navigateur aux origines critiques.
// Vercel edge + DB Prisma sont les deux goulots d'étranglement TTFB.
export function ResourceHints() {
  return (
    <>
      {/* DNS prefetch pour les domaines tiers */}
      <link rel="dns-prefetch" href="//vercel.app" />
      <link rel="dns-prefetch" href="//vercel-dns.com" />
      {/* Preconnect à l'origine principale (edge Vercel) */}
      <link rel="preconnect" href="https://seuils-virid.vercel.app" crossOrigin="anonymous" />
      {/* Preconnect à l'API (même origin mais Force HTTP/2 push) */}
      <link rel="preconnect" href="https://seuils-virid.vercel.app/api" crossOrigin="anonymous" />
    </>
  );
}
