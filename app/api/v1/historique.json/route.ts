// app/api/v1/historique.json/route.ts
// Historique des seuils : ce que ce projet conserve et que les autres ne conservent pas.

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { donnees, origine } = await lireAvecRepli(
    async () => {
      const historique = await prisma.parametre.findMany({
        where: {
          categorie: {
            in: [
              'seuil_micro_fiscal_historique',
              'tva_seuil_base_historique',
              'tva_seuil_majore_historique',
            ],
          },
        },
        include: { source: true },
        orderBy: [{ annee: 'asc' }, { categorie: 'asc' }, { code: 'asc' }],
      });

      return {
        version_api: 'v1',
        origine: 'base',
        count: historique.length,
        historique: historique.map((l) => ({
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
    'historique.json'
  );

  return NextResponse.json(
    {
      version_api: 'v1',
      origine,
      count: donnees?.count ?? 0,
      historique: donnees?.historique ?? [],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
