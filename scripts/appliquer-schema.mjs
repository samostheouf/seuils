// appliquer-schema.mjs — cree les tables Seuils dans Prisma Postgres.
//
// POURQUOI CE SCRIPT EXISTE
// Les moteurs natifs de Prisma ne tournent pas sur Termux/Android
// (`libquery_engine-debian-openssl-1.1.x.so.node` introuvable).
// On applique donc le DDL directement, en SQL, via `pg` (pur JavaScript).
// Le schema Prisma reste la reference : ce SQL doit lui correspondre exactement.
// Sur Vercel (Linux x86_64), `prisma db push` prend le relais au build.
//
// Usage: node scripts/appliquer-schema.mjs
// Idempotent : CREATE TABLE IF NOT EXISTS. Relancer ne casse rien.

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function lireEnv(fichier) {
  const out = {};
  if (!fs.existsSync(fichier)) return out;
  for (const ligne of fs.readFileSync(fichier, 'utf8').split('\n')) {
    const m = ligne.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

// La chaine de connexion vient du projet ai-empire (meme base Prisma Postgres),
// sauf si seuils/.env en definit une propre.
const envSeuils = lireEnv(path.join(RACINE, '.env'));
const envAiEmpire = lireEnv(path.join(process.env.HOME, 'ai-empire', '.env'));
const url = envSeuils.DATABASE_URL || envAiEmpire.DATABASE_URL || envAiEmpire.POSTGRES_URL;

if (!url) {
  console.error('ECHEC : aucune DATABASE_URL trouvee (seuils/.env ou ai-empire/.env)');
  process.exit(1);
}

const DDL = `
CREATE TABLE IF NOT EXISTS seuils_source (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  url         TEXT NOT NULL,
  nature      TEXT
);

CREATE TABLE IF NOT EXISTS seuils_parametre (
  id          TEXT PRIMARY KEY,
  categorie   TEXT NOT NULL,
  code        TEXT NOT NULL,
  libelle     TEXT NOT NULL,
  valeur      DOUBLE PRECISION NOT NULL,
  unite       TEXT NOT NULL,
  annee       TEXT NOT NULL,
  regime      TEXT NOT NULL DEFAULT 'normal',
  note        TEXT,
  "sourceId"  TEXT NOT NULL REFERENCES seuils_source(id),
  "verifieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creeLe"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT seuils_parametre_cle_metier UNIQUE (categorie, code, annee, regime)
);
CREATE INDEX IF NOT EXISTS seuils_parametre_cat_annee ON seuils_parametre (categorie, annee);

CREATE TABLE IF NOT EXISTS seuils_changement (
  id          TEXT PRIMARY KEY,
  date        TIMESTAMP(3) NOT NULL,
  statut      TEXT NOT NULL,
  champ       TEXT NOT NULL,
  avant       JSONB NOT NULL,
  apres       JSONB NOT NULL,
  raison      TEXT NOT NULL,
  impact      TEXT,
  "baseLegale" TEXT,
  "sourceId"  TEXT NOT NULL REFERENCES seuils_source(id),
  "creeLe"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS seuils_changement_date ON seuils_changement (date);

CREATE TABLE IF NOT EXISTS seuils_verification (
  id          TEXT PRIMARY KEY,
  "executeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cible       TEXT NOT NULL,
  libelle     TEXT NOT NULL,
  resultat    TEXT NOT NULL,
  detail      TEXT,
  url         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS seuils_verification_date ON seuils_verification ("executeeLe");
CREATE INDEX IF NOT EXISTS seuils_verification_cible ON seuils_verification (cible, resultat);
`;

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('Connecte a', new URL(url).host);
  await client.query(DDL);
  const r = await client.query(
    "select table_name from information_schema.tables where table_name like 'seuils_%' order by 1"
  );
  console.log('Tables Seuils presentes :', r.rowCount);
  for (const ligne of r.rows) console.log('   ', ligne.table_name);
  console.log('Schema applique. 0 erreur.');
  await client.end();
} catch (e) {
  console.error('ECHEC :', e.code || '', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
