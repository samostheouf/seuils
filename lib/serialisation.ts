// lib/serialisation.ts — mise en forme commune a toutes les reponses.
//
// Une seule fonction pour construire le JSON servi : garantit que la page
// humaine, l'API et le CSV decrivent exactement la meme chose.

import fs from 'fs';
import path from 'path';

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

/**
 * Les metadonnees du jeu de donnees : incertitudes declarees et changements a venir.
 *
 * POURQUOI CES DONNEES NE SONT PAS EN BASE : ce ne sont pas des valeurs de regime,
 * ce sont des affirmations sur le jeu de donnees lui-meme. Les mettre dans
 * seuils_parametre les ferait passer pour des seuils comme les autres.
 *
 * POURQUOI IL NE FAUT PAS LES OUBLIER : la regle 2 du projet est « une valeur non
 * verifiee est publiee comme telle ». Ne pas les servir revient a publier un jeu de
 * donnees qui parait complet alors qu'il declare des lacunes. Un consommateur machine
 * ne peut pas voir ce que le depot sait incertain.
 *
 * Source : le fichier committe data/parametres.json, qui est la source du seed.
 */
export type Metadonnees = {
  lacunes_connues: unknown[];
  changement_a_venir: unknown | null;
};

export async function chargerMetadonnees(): Promise<Metadonnees> {
  return lireAvecRepli<Metadonnees>(
    async () => {
      const brut = fs.readFileSync(path.join(process.cwd(), 'data', 'parametres.json'), 'utf8');
      const p = JSON.parse(brut);
      return {
        lacunes_connues: Array.isArray(p.lacunes_connues) ? p.lacunes_connues : [],
        changement_a_venir: p.changement_a_venir ?? null,
      };
    },
    'metadonnees.json'
  ).then((r) => r.donnees ?? { lacunes_connues: [], changement_a_venir: null });
}
