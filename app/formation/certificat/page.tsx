import type { Metadata } from 'next';
import CertificatClient from './CertificatClient';

// Le composant est un client component ('use client') : il ne peut pas porter
// de metadata. Ce wrapper serveur les fournit. Sans lui, la page partageait le
// titre et le canonical de la page d'accueil — deux pages differentes, un seul
// titre, ce que les moteurs lisent comme un contenu duplique.
export const metadata: Metadata = {
  title: 'Certificat de complétion — Seuils micro-entrepreneur',
  description:
    'Certificat du parcours en 5 étapes, delivre apres validation des quiz. Les valeurs citees viennent des sources officielles publiees sur ce site.',
  alternates: { canonical: '/formation/certificat' },
  robots: { index: false, follow: false },
  openGraph: {
    type: 'article',
    title: 'Certificat de completion',
    description: 'Parcours en 5 etapes : seuils, cotisations, TVA, ACRE et historique.',
    url: 'https://seuils-virid.vercel.app/formation/certificat',
  },
};

export default function CertificatPage() {
  return <CertificatClient />;
}
