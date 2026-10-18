// app/api/v1/drom.json/route.ts
// Taux de cotisations pour les DOM-TOM et Mayotte.
// Source : tableau officiel Urssaf (ne pas recalculer, la source les publie).

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return lireAvecRepli(
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
    'drom.json'
  );
}
