// app/api/v1/csv/route.ts
// Export CSV de tous les paramètres (alias de /api/v1/parametres.csv).

import { NextResponse } from 'next/server';
import { prisma, lireAvecRepli } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

function cellule(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  return lireAvecRepli(
    async () => {
      const params = await prisma.parametre.findMany({
        include: { source: true },
        orderBy: [{ categorie: 'asc' }, { code: 'asc' }, { annee: 'asc' }],
      });

      const lignes: string[] = ['categorie,code,libelle,valeur,unite,annee,regime,source'];
      for (const p of params) {
        lignes.push(
          [p.categorie, p.code, p.libelle, p.valeur, p.unite, p.annee, p.regime, p.sourceId]
            .map(cellule)
            .join(',')
        );
      }

      return new NextResponse(lignes.join('\n') + '\n', {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'inline; filename="seuils-complet.csv"',
          'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    },
    'parametres.csv'
  );
}
