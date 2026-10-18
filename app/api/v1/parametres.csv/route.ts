// app/api/v1/parametres.csv/route.ts
// Le meme contenu, a plat, pour un tableur.
// Le CSV est genere a la volee depuis la base : il ne peut pas diverger du JSON.

import { NextResponse } from 'next/server';
import { chargerParametres } from '@/lib/serialisation';

export const dynamic = 'force-dynamic';

function cellule(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const { donnees, origine } = await chargerParametres();

  const lignes: string[] = ['categorie,code,libelle,valeur,unite,annee,regime,source'];
  for (const p of donnees ?? []) {
    lignes.push(
      [p.categorie, p.code, p.libelle, p.valeur, p.unite, p.annee, p.regime, p.source]
        .map(cellule)
        .join(',')
    );
  }

  return new NextResponse(lignes.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="seuils-parametres.csv"',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Origine': origine,
    },
  });
}
