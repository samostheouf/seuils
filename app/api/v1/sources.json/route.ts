// app/api/v1/sources/route.ts
// Les pages officielles d'ou vient chaque valeur.

import { NextResponse } from 'next/server';
import { chargerSources, VERSION_API } from '../../../../lib/serialisation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = await chargerSources();
  return NextResponse.json(
    { version_api: VERSION_API, origine: sources.origine, sources: sources.donnees ?? [] },
    { headers: { 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } }
  );
}
