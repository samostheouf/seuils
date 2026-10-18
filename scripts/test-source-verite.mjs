// test-source-verite.mjs — prouve que le site lit la BASE, pas le snapshot.
//
// Methode : on insere une valeur temoin directement en base, on interroge l'API
// en live, on verifie qu'elle apparait, puis on la retire. Si elle apparait,
// la base est bien la source de verite. Si elle n'apparait pas, le site sert
// le snapshot et l'architecture est fausse.
//
// Usage: node scripts/test-source-verite.mjs

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DOMAINE = 'https://seuils-virid.vercel.app';
const TEMOIN = 'TEMOIN-ARCHITECTURE-NE-PAS-GARDER';

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

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
const id = 'TEMOIN|test|2026|normal';

try {
  await client.connect();

  await client.query(
    `INSERT INTO seuils_parametre
       (id, categorie, code, libelle, valeur, unite, annee, regime, "sourceId")
     VALUES ($1, 'TEMOIN', 'test', $2, 12345, 'EUR', '2026', 'normal', 'economie.gouv')
     ON CONFLICT (id) DO UPDATE SET valeur = 12345`,
    [id, TEMOIN]
  );
  console.log('1. Valeur temoin inseree en base.');

  // Le CDN met en cache 1 h (s-maxage). Sans parametre anti-cache, on lit une
  // reponse figee et on conclut a tort que la base n'est pas lue.
  const reponse = await fetch(`${DOMAINE}/api/v1/parametres.json?bust=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  const corps = await reponse.json();
  const trouve = (corps.parametres || []).some((p) => p.libelle === TEMOIN);
  const total = (corps.parametres || []).length;

  console.log(`2. API interrogee : HTTP ${reponse.status} (origine : ${corps.origine})`);
  console.log(`3. Parametres renvoyes : ${total}`);
  console.log(`4. Valeur temoin presente dans la reponse : ${trouve ? 'OUI' : 'NON'}`);

  await client.query('DELETE FROM seuils_parametre WHERE id = $1', [id]);
  console.log('5. Valeur temoin retiree.');

  if (trouve) {
    console.log();
    console.log('CONFIRME : la base est la source de verite. L API la lit en direct.');
    process.exit(0);
  } else {
    console.log();
    console.log('ECHEC : la valeur temoin n apparait pas.');
    console.log('Le site sert le snapshot, pas la base : architecture a corriger.');
    process.exit(1);
  }
} catch (e) {
  console.error('ECHEC :', e.code || '', e.message);
  try { await client.query('DELETE FROM seuils_parametre WHERE id = $1', [id]); } catch {}
  try { await client.end(); } catch {}
  process.exit(1);
}
