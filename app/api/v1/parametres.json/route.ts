// app/api/v1/parametres/route.ts
// Toutes les valeurs, avec l'identifiant de leur source.
// Ne renvoie jamais d'erreur : en cas de panne de la base, sert le snapshot.

import { NextResponse } from 'next/server';
import { chargerParametres, chargerSources, chargerMeta, VERSION_API } from '../../../../lib/serialisation';

// ISR : les réponses API sont mises en cache par le CDN Vercel (s-maxage=3600).
export const revalidate = 3600;

export async function GET() {
  const [parametres, sources, meta] = await Promise.all([
    chargerParametres(),
    chargerSources(),
    chargerMeta(),
  ]);

  return NextResponse.json(
    {
      version_api: VERSION_API,
      version_donnees: meta?.version ?? 'inconnue',
      mise_a_jour: meta?.miseAJour ?? null,
      origine: parametres.origine,
      ...(parametres.origine === 'snapshot'
        ? { avertissement: 'Base injoignable : valeurs servies depuis le dernier snapshot connu.' }
        : {}),
      sources: sources.donnees ?? [],
      parametres: parametres.donnees ?? [],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
