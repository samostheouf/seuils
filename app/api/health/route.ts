// app/api/health/route.ts
// Etat reel du service : la base repond-elle, et combien de valeurs sert-elle ?

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debut = Date.now();
  try {
    const [parametres, sources, changements] = await Promise.all([
      prisma.parametre.count(),
      prisma.source.count(),
      prisma.changement.count(),
    ]);
    return NextResponse.json({
      statut: 'ok',
      base: 'joignable',
      latence_ms: Date.now() - debut,
      contenu: { parametres, sources, changements },
    });
  } catch (e) {
    return NextResponse.json(
      {
        statut: 'degrade',
        base: 'injoignable',
        erreur: e instanceof Error ? e.message : String(e),
        note: "L'API continue de servir le dernier snapshot connu.",
      },
      { status: 200 } // volontairement 200 : le site fonctionne, la base non
    );
  }
}
