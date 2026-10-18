import type { Metadata } from 'next';
import './globals.css';
import { CriticalCSS } from './critical-css';
import { ResourceHints } from './resource-hints';

const URL_SITE = 'https://seuils-virid.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: 'Seuils micro-entrepreneur 2026 — données officielles, lisibles par machine',
  description:
    "Seuils, cotisations et TVA du régime micro-entrepreneur. Chaque valeur tracée à sa source officielle, avec l'historique des changements et une API JSON gratuite.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Seuils micro-entrepreneur 2026 — données officielles',
    description:
      "Seuils, cotisations et TVA du régime micro-entrepreneur. Chaque valeur tracée à sa source. API JSON gratuite.",
    url: URL_SITE,
  },
  twitter: { card: 'summary' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <ResourceHints />
        <CriticalCSS />
      </head>
      <body>{children}</body>
    </html>
  );
}
