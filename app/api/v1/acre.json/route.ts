// app/api/v1/acre.json/route.ts
// Taux ACRE : réduction de cotisations pour les créateurs d'entreprise.

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { donnees, origine } = await lireAvecRepli(
    async () => {
      const acre = await prisma.parametre.findMany({
        where: { categorie: 'taux_acre' },
        include: { source: true },
        orderBy: [{ annee: 'desc' }, { code: 'asc' }],
      });

      return {
        version_api: 'v1',
        origine: 'base',
        count: acre.length,
        acre: acre.map((l) => ({
          categorie: l.categorie,
          code: l.code,
          libelle: l.libelle,
          valeur: l.valeur,
          unite: l.unite,
          annee: l.annee,
          regime: l.regime,
          note: l.note,
          source: l.sourceId,
        })),
      };
    },
    'parametres.json'
  );

  return NextResponse.json(
    {
      version_api: 'v1',
      origine,
      count: donnees?.count ?? 0,
      acre: donnees?.acre ?? [],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
