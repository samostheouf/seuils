// app/feed.xml/route.ts — flux RSS 2.0 des 5 derniers changements.
//
// Le flux reprend le pattern de l'API JSON : lireAvecRepli garantit qu'on
// sert toujours un contenu correct, même si la base est injoignable (repli
// sur le snapshot committe). RSS 2.0 strict : titre, description, pubDate,
// link et guid par item.

import { NextResponse } from 'next/server';
import { lireAvecRepli } from '../../../lib/prisma';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

const URL_SITE = 'https://seuils-virid.vercel.app';
const MAX_ITEMS = 5;

function echapperXml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formaterDateRss(date: Date): string {
  return date.toUTCString();
}

export async function GET() {
  const { donnees, origine } = await lireAvecRepli(
    async () => {
      const lignes = await prisma.changement.findMany({
        orderBy: { date: 'desc' },
        take: MAX_ITEMS,
      });
      return lignes.map((l) => ({
        id: l.id,
        date: l.date,
        statut: l.statut,
        champ: l.champ,
        raison: l.raison,
        impact: l.impact,
        baseLegale: l.baseLegale,
      }));
    },
    'changelog.json'
  );

  const changements = donnees ?? [];
  const dateBuild = formaterDateRss(new Date());

  const items = changements
    .map((c) => {
      const titre = `[${c.statut}] ${c.champ} — ${c.date.toISOString().slice(0, 10)}`;
      let description = c.raison;
      if (c.impact) {
        description += `\n\nImpact : ${c.impact}`;
      }
      const datePub = formaterDateRss(c.date);
      const lien = `${URL_SITE}/#changelog`;
      const guid = c.id;

      return `    <item>
      <title>${echapperXml(titre)}</title>
      <description>${echapperXml(description)}</description>
      <pubDate>${datePub}</pubDate>
      <link>${lien}</link>
      <guid isPermaLink="false">${guid}</guid>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Seuils micro-entrepreneur — Derniers changements</title>
    <description>Les ${MAX_ITEMS} derniers changements des paramètres du régime micro-entrepreneur : seuils, cotisations, TVA.</description>
    <link>${URL_SITE}</link>
    <lastBuildDate>${dateBuild}</lastBuildDate>
    <language>fr-FR</language>${origine === 'snapshot' ? `\n    <generator>seuils (snapshot — base injoignable)</generator>` : ''}
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
