// app/api/v1/acre.json/route.ts
// Taux ACRE : réduction de cotisations pour les créateurs d'entreprise.
// Depuis le 1er juillet 2026, le taux minoré est passé de 50 % à 75 % du taux normal
// (décret n° 2026-69 du 6 février 2026).

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return lireAvecRepli(
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
    'acre.json'
  );
}
