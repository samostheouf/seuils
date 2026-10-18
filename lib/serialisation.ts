// lib/serialisation.ts — mise en forme commune a toutes les reponses.
//
// Une seule fonction pour construire le JSON servi : garantit que la page
// humaine, l'API et le CSV decrivent exactement la meme chose.

import { prisma, lireAvecRepli } from './prisma';

export const VERSION_API = 'v1';

export type Parametre = {
  categorie: string;
  code: string;
  libelle: string;
  valeur: number;
  unite: string;
  annee: string;
  regime: string;
  note: string | null;
  source: string;
};

export type Changement = {
  date: string;
  statut: string;
  champ: string;
  avant: unknown;
  apres: unknown;
  raison: string;
  impact: string | null;
  baseLegale: string | null;
  source: string;
};

/** Tous les parametres, avec l'identifiant de leur source. */
export async function chargerParametres() {
  return lireAvecRepli<Parametre[]>(
    async () => {
      const lignes = await prisma.parametre.findMany({
        include: { source: true },
        orderBy: [{ categorie: 'asc' }, { code: 'asc' }, { annee: 'asc' }],
      });
      return lignes.map((l) => ({
        categorie: l.categorie,
        code: l.code,
        libelle: l.libelle,
        valeur: l.valeur,
        unite: l.unite,
        annee: l.annee,
        regime: l.regime,
        note: l.note,
        source: l.sourceId,
      }));
    },
    'parametres.json'
  );
}

/** Tous les changements, du plus recent au plus ancien. */
export async function chargerChangements() {
  return lireAvecRepli<Changement[]>(
    async () => {
      const lignes = await prisma.changement.findMany({
        orderBy: { date: 'desc' },
      });
      return lignes.map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        statut: l.statut,
        champ: l.champ,
        avant: l.avant,
        apres: l.apres,
        raison: l.raison,
        impact: l.impact,
        baseLegale: l.baseLegale,
        source: l.sourceId,
      }));
    },
    'changelog.json'
  );
}

/** Toutes les sources declarees. */
export async function chargerSources() {
  return lireAvecRepli<{ id: string; nom: string; url: string; nature: string | null }[]>(
    async () => {
      const lignes = await prisma.source.findMany({ orderBy: { id: 'asc' } });
      return lignes.map((l) => ({ id: l.id, nom: l.nom, url: l.url, nature: l.nature }));
    },
    'sources.json'
  );
}

/** La version du jeu de donnees : date de derniere modification + volumetrie. */
export async function chargerMeta() {
  const { donnees } = await lireAvecRepli<{ version: string; parametres: number; miseAJour: string } | null>(
    async () => {
      const [dernier, total] = await Promise.all([
        prisma.parametre.findFirst({ orderBy: { majLe: 'desc' } }),
        prisma.parametre.count(),
      ]);
      const date = dernier ? dernier.majLe.toISOString().slice(0, 10) : 'inconnue';
      return { version: date, parametres: total, miseAJour: date };
    },
    'meta.json'
  );
  return donnees;
}
