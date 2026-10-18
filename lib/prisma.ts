// lib/prisma.ts — acces a la base, avec repli sur le snapshot committe.
//
// PRINCIPE : l'API ne doit JAMAIS renvoyer une erreur 500 ni une valeur fausse.
// Si la base est injoignable, on sert le dernier snapshot connu, genere depuis
// la base par le pipeline. Le snapshot n'est jamais ecrit a la main : il est
// toujours une copie fidele de la base, produite par scripts/snapshot.mjs.
//
// Consequence : base en panne = site degrade mais juste, jamais faux.

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type Origine = 'base' | 'snapshot';

function lireSnapshot(nom: string): unknown | null {
  try {
    const chemin = path.join(process.cwd(), 'snapshot', nom);
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Execute une lecture en base. Si la base echoue, sert le snapshot committe.
 * Retourne toujours { donnees, origine } — jamais une exception.
 */
export async function lireAvecRepli<T>(
  lectureBase: () => Promise<T>,
  nomSnapshot: string
): Promise<{ donnees: T | null; origine: Origine; erreur?: string }> {
  try {
    const donnees = await lectureBase();
    return { donnees, origine: 'base' };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const secours = lireSnapshot(nomSnapshot) as T | null;
    if (secours) {
      return { donnees: secours, origine: 'snapshot', erreur: message };
    }
    return { donnees: null, origine: 'snapshot', erreur: message };
  }
}
