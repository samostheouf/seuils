// app/api/v1/parametres/route.ts
// Toutes les valeurs, avec l'identifiant de leur source.
// Ne renvoie jamais d'erreur : en cas de panne de la base, sert le snapshot.

import { NextResponse } from 'next/server';
import { chargerParametres, chargerSources, chargerMeta, chargerMetadonnees, VERSION_API } from '../../../../lib/serialisation';

// ISR : les réponses API sont mises en cache par le CDN Vercel (s-maxage=3600).
export const revalidate = 3600;

export async function GET() {
  const [parametres, sources, meta, metadonnees] = await Promise.all([
    chargerParametres(),
    chargerSources(),
    chargerMeta(),
    chargerMetadonnees(),
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
      // Les incertitudes et le changement a venir font partie du jeu de donnees :
      // un consommateur machine doit pouvoir les lire, pas seulement les humain.
      lacunes_connues: metadonnees.lacunes_connues ?? [],
      changement_a_venir: metadonnees.changement_a_venir ?? null,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
