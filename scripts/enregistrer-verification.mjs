// enregistrer-verification.mjs — ecrit le resultat de la veille dans la base.
//
// Sans ce journal, personne ne peut prouver que le controle tourne vraiment.
// Chaque execution de la veille laisse une trace : CONFORME, ABSENTE ou INDISPONIBLE.
// Une erreur reseau est notee INDISPONIBLE, jamais comme un changement.
//
// Usage: node scripts/enregistrer-verification.mjs   (lit le JSON sur stdin)

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

let entree = '';
process.stdin.setEncoding('utf8');
for await (const morceau of process.stdin) entree += morceau;

let verifications;
try {
  verifications = JSON.parse(entree);
  if (!Array.isArray(verifications)) throw new Error('tableau attendu');
} catch (e) {
  console.error('ECHEC : JSON invalide sur stdin —', e.message);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  for (const v of verifications) {
    const id = `${Date.now()}|${v.cible}|${Math.random().toString(36).slice(2, 8)}`;
    await client.query(
      `INSERT INTO seuils_verification (id, cible, libelle, resultat, detail, url)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, v.cible, v.libelle, v.resultat, v.detail ?? null, v.url]
    );
  }
  console.log(`Journal de veille : ${verifications.length} entree(s) enregistree(s).`);
  await client.end();
} catch (e) {
  console.error('ECHEC :', e.code || '', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
