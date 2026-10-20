// snapshot.mjs — exporte la base vers snapshot/, committe dans le depot.
//
// POURQUOI : si la base tombe, l'API doit continuer a servir des valeurs justes.
// Le snapshot est ce filet. Il est TOUJOURS genere depuis la base, jamais edite
// a la main — c'est ce qui garantit qu'il ne peut pas diverger.
//
// Usage: node scripts/snapshot.mjs

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(RACINE, 'snapshot');

function lireEnv(f) {
  const o = {};
  if (!fs.existsSync(f)) return o;
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return o;
}
const url = lireEnv(path.join(RACINE, '.env')).DATABASE_URL ||
            lireEnv(path.join(process.env.HOME, 'ai-empire', '.env')).DATABASE_URL;
if (!url) { console.error('ECHEC : DATABASE_URL introuvable'); process.exit(1); }

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  fs.mkdirSync(SORTIE, { recursive: true });

  const parametres = (await client.query(
    `select categorie, code, libelle, valeur, unite, annee, regime, note, "sourceId" as source
     from seuils_parametre order by categorie, code, annee, regime`
  )).rows;

  const changements = (await client.query(
    `select to_char(date,'YYYY-MM-DD') as date, statut, champ, avant, apres, raison,
            impact, "baseLegale" as "baseLegale", "sourceId" as source
     from seuils_changement order by date desc`
  )).rows;

  const sources = (await client.query(
    `select id, nom, url, nature from seuils_source order by id`
  )).rows;

  const ecrire = (nom, donnees) =>
    fs.writeFileSync(path.join(SORTIE, nom), JSON.stringify(donnees, null, 2) + '\n', 'utf8');

  ecrire('parametres.json', parametres);
  ecrire('changelog.json', changements);
  ecrire('sources.json', sources);

  const maintenant = new Date().toISOString().slice(0, 10);
  ecrire('meta.json', { version: maintenant, parametres: parametres.length, miseAJour: maintenant });

  // Metadonnees du jeu de donnees : elles ne sont pas en base, donc sans ce filet
  // une panne de lecture du fichier les ferait disparaitre de l'API.
  try {
    const brut = fs.readFileSync(path.join(RACINE, 'data', 'parametres.json'), 'utf8');
    const p = JSON.parse(brut);
    ecrire('metadonnees.json', {
      lacunes_connues: Array.isArray(p.lacunes_connues) ? p.lacunes_connues : [],
      changement_a_venir: p.changement_a_venir ?? null,
    });
  } catch (e) {
    console.error('   metadonnees.json non genere :', e.message);
  }

  console.log('Snapshot genere depuis la base :');
  console.log(`   parametres.json  ${parametres.length} entrees`);
  console.log(`   changelog.json   ${changements.length} entrees`);
  console.log(`   sources.json     ${sources.length} entrees`);
  console.log(`   meta.json`);
  console.log(`   -> ${SORTIE}`);
  await client.end();
} catch (e) {
  console.error('ECHEC :', e.code || '', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
