// app/api/v1/changelog/route.ts
// L'historique date des changements : ce que ce projet conserve et que les autres ne conservent pas.

import { NextResponse } from 'next/server';
import { chargerChangements, VERSION_API } from '@/lib/serialisation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const changements = await chargerChangements();

  return NextResponse.json(
    {
      version_api: VERSION_API,
      origine: changements.origine,
      ...(changements.origine === 'snapshot'
        ? { avertissement: 'Base injoignable : valeurs servies depuis le dernier snapshot connu.' }
        : {}),
      changements: changements.donnees ?? [],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
