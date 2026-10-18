// app/api/v1/drom.json/route.ts
// Taux de cotisations pour les DOM-TOM et Mayotte.

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { donnees, origine } = await lireAvecRepli(
    async () => {
      const drom = await prisma.parametre.findMany({
        where: {
          categorie: {
            in: ['drom_p1', 'drom_p2', 'drom_p3', 'mayotte'],
          },
        },
        include: { source: true },
        orderBy: [{ annee: 'desc' }, { categorie: 'asc' }, { code: 'asc' }],
      });

      return {
        version_api: 'v1',
        origine: 'base',
        count: drom.length,
        drom: drom.map((l) => ({
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
      drom: donnees?.drom ?? [],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
