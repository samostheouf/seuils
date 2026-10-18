// app/api/v1/tva.json/route.ts
// Seuils de franchise en base de TVA.

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { donnees, origine } = await lireAvecRepli(
    async () => {
      const tva = await prisma.parametre.findMany({
        where: {
          categorie: {
            in: [
              'tva_seuil_base',
              'tva_seuil_majore',
              'tva_seuil_base_historique',
              'tva_seuil_majore_historique',
            ],
          },
        },
        include: { source: true },
        orderBy: [{ annee: 'desc' }, { categorie: 'asc' }, { code: 'asc' }],
      });

      return {
        version_api: 'v1',
        origine: 'base',
        count: tva.length,
        tva: tva.map((l) => ({
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
      tva: donnees?.tva ?? [],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
