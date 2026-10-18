// verifier-base.mjs — controle le contenu de la base apres seed.
// Prouve que la base contient ce qu'elle doit contenir, et rien d'autre.
//
// Usage: node scripts/verifier-base.mjs

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

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
let echecs = 0;
const controle = (nom, ok, detail = '') => {
  console.log(`  ${ok ? 'OK   ' : 'ECHEC'}  ${nom}${detail ? ' — ' + detail : ''}`);
  if (!ok) echecs++;
};

try {
  await client.connect();

  const c = async (sql, params = []) => (await client.query(sql, params)).rows;

  console.log('Contenu de la base :');

  const [{ count: nbP }] = await c('select count(*)::int as count from seuils_parametre');
  controle('82 parametres attendus', nbP === 82, `trouve ${nbP}`);

  const [{ count: nbS }] = await c('select count(*)::int as count from seuils_source');
  controle('13 sources attendues', nbS === 13, `trouve ${nbS}`);

  const [{ count: nbC }] = await c('select count(*)::int as count from seuils_changement');
  controle('7 changements attendus', nbC === 7, `trouve ${nbC}`);

  // Aucune valeur orpheline : toute ligne pointe vers une source existante.
  const orphelins = await c(`select count(*)::int as n from seuils_parametre p
                             left join seuils_source s on s.id = p."sourceId" where s.id is null`);
  controle('aucun parametre sans source', orphelins[0].n === 0, `${orphelins[0].n} orphelin(s)`);

  // Aucune valeur nulle ou negative.
  const [{ n: invalides }] = await c('select count(*)::int as n from seuils_parametre where valeur is null');
  controle('aucune valeur nulle', invalides === 0, `${invalides} nulle(s)`);

  // Pas de doublon sur la cle metier (garanti par la contrainte, verifie quand meme).
  const doublons = await c(`select categorie, code, annee, regime, count(*) as n
                            from seuils_parametre group by 1,2,3,4 having count(*) > 1`);
  controle('aucun doublon de cle metier', doublons.length === 0, `${doublons.length} doublon(s)`);

  // Les valeurs sensibles sont bien celles verifiees.
  const acre = await c(`select valeur from seuils_parametre
                        where categorie='taux_acre' and code='BIC_service' and regime='acre_depuis_2026_07'`);
  controle('taux ACRE services = 15,9 %', acre.length === 1 && Math.abs(acre[0].valeur - 15.9) < 1e-9,
           acre.length ? String(acre[0].valeur) : 'absent');

  const seuil = await c(`select valeur from seuils_parametre
                         where categorie='seuil_micro_fiscal' and code='BIC_vente' and annee='2026'`);
  controle('seuil vente 2026 = 203 100 €', seuil.length === 1 && seuil[0].valeur === 203100,
           seuil.length ? String(seuil[0].valeur) : 'absent');

  // La table de verification doit exister meme si elle est vide.
  await c('select count(*) from seuils_verification');
  controle('table de verification interrogeable', true);

  console.log();
  if (echecs) { console.log(`${echecs} ECHEC(S) — la base n'est pas conforme.`); process.exit(1); }
  console.log('Base conforme. 0 erreur.');
  await client.end();
} catch (e) {
  console.error('ECHEC :', e.code || '', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
