// seed.mjs — charge data/*.json dans Prisma Postgres.
//
// Idempotent : les identifiants sont déterministes (dérivés de la clé métier),
// donc relancer écrase la même ligne au lieu d'en créer une deuxième.
// C'est ce qui garantit qu'il n'existe jamais deux valeurs contradictoires.
//
// Usage: node scripts/seed.mjs

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(RACINE, 'data');

function lireEnv(fichier) {
  const out = {};
  if (!fs.existsSync(fichier)) return out;
  for (const ligne of fs.readFileSync(fichier, 'utf8').split('\n')) {
    const m = ligne.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function lireJSON(nom) {
  return JSON.parse(fs.readFileSync(path.join(DATA, nom), 'utf8'));
}

const url =
  lireEnv(path.join(RACINE, '.env')).DATABASE_URL ||
  lireEnv(path.join(process.env.HOME, 'ai-empire', '.env')).DATABASE_URL;

if (!url) { console.error('ECHEC : DATABASE_URL introuvable'); process.exit(1); }

const P = lireJSON('parametres.json');
const H = lireJSON('historique.json');
const C = lireJSON('changelog.json');

// --- construction des lignes -------------------------------------------------

const sources = P.sources.map((s) => ({
  id: s.id,
  nom: s.nom,
  url: s.url,
  nature: s.id.split('-')[0],
}));

const parametres = [];
const ajouter = (categorie, code, libelle, valeur, unite, annee, sourceId, regime = 'normal', note = null) => {
  parametres.push({ categorie, code, libelle, valeur, unite, annee, sourceId, regime, note });
};

for (const v of P.seuils_micro_fiscal.valeurs)
  ajouter('seuil_micro_fiscal', v.code, v.activite, v.seuil, 'EUR', '2026', P.seuils_micro_fiscal.source);

for (const v of P.seuils_tva_franchise.valeurs) {
  ajouter('tva_seuil_base', v.code, v.activite, v.seuil_base, 'EUR', '2026', P.seuils_tva_franchise.source);
  ajouter('tva_seuil_majore', v.code, v.activite, v.seuil_majore, 'EUR', '2026', P.seuils_tva_franchise.source);
}

for (const v of P.taux_cotisations_sociales.valeurs)
  ajouter('taux_cotisation', v.code, v.activite, v.taux, 'POURCENT', '2026', P.taux_cotisations_sociales.source, 'normal', v.note ?? null);

for (const v of P.versement_liberatoire.valeurs)
  ajouter('versement_liberatoire', v.code, v.activite, v.taux, 'POURCENT', '2026', P.versement_liberatoire.source);

for (const v of P.acre.valeurs) {
  ajouter('taux_acre', v.code, v.activite, v.taux_avant_2026_07_01, 'POURCENT', '2026', P.acre.source, 'acre_avant_2026_07');
  ajouter('taux_acre', v.code, v.activite, v.taux_depuis_2026_07_01, 'POURCENT', '2026', P.acre.source, 'acre_depuis_2026_07');
  ajouter('taux_normal_reference', v.code, v.activite, v.taux_normal, 'POURCENT', '2026', P.taux_cotisations_sociales.source);
}

for (const v of P.drom.taux_par_activite) {
  for (const [per, cat] of [['periode_1', 'drom_p1'], ['periode_2', 'drom_p2'], ['periode_3', 'drom_p3']])
    ajouter(cat, v.code, v.activite, v[per], 'POURCENT', '2026', P.drom.source, 'drom', v.note ?? null);
}

for (const v of P.mayotte.taux)
  ajouter('mayotte', v.code, v.activite, v.taux, 'POURCENT', '2026', P.mayotte.source, 'mayotte');

for (const [annee, vals] of Object.entries(H.seuils_micro_fiscal.par_annee)) {
  for (const [code, valeur] of Object.entries(vals)) {
    if (typeof valeur !== 'number') continue;
    ajouter('seuil_micro_fiscal_historique', code, code, valeur, 'EUR', annee, vals.source ?? H.seuils_micro_fiscal.source);
  }
}

for (const [code, v] of Object.entries(H.seuils_tva_franchise.par_annee['2023_2024_2025'])) {
  if (typeof v !== 'object' || !v.seuil_base) continue;
  ajouter('tva_seuil_base_historique', code, code, v.seuil_base, 'EUR', '2023-2025', 'economie-depassement');
  ajouter('tva_seuil_majore_historique', code, code, v.seuil_majore, 'EUR', '2023-2025', 'economie-depassement');
}

const changements = C.entrees.map((e) => ({
  id: `${e.date}|${e.champ}`.slice(0, 200),
  date: e.date,
  statut: e.statut,
  champ: e.champ,
  avant: e.avant,
  apres: e.apres,
  raison: e.raison,
  impact: e.impact ?? null,
  baseLegale: e.base_legale ?? null,
  sourceId: e.source,
}));

// --- ecriture ----------------------------------------------------------------

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query('BEGIN');

  for (const s of sources) {
    await client.query(
      `INSERT INTO seuils_source (id, nom, url, nature) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET nom=EXCLUDED.nom, url=EXCLUDED.url, nature=EXCLUDED.nature`,
      [s.id, s.nom, s.url, s.nature]
    );
  }

  for (const p of parametres) {
    const id = `${p.categorie}|${p.code}|${p.annee}|${p.regime}`;
    await client.query(
      `INSERT INTO seuils_parametre
         (id, categorie, code, libelle, valeur, unite, annee, regime, note, "sourceId", "verifieLe", "majLe")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         libelle=EXCLUDED.libelle, valeur=EXCLUDED.valeur, unite=EXCLUDED.unite,
         note=EXCLUDED.note, "sourceId"=EXCLUDED."sourceId",
         "verifieLe"=CURRENT_TIMESTAMP, "majLe"=CURRENT_TIMESTAMP`,
      [id, p.categorie, p.code, p.libelle, p.valeur, p.unite, p.annee, p.regime, p.note, p.sourceId]
    );
  }

  for (const c of changements) {
    await client.query(
      `INSERT INTO seuils_changement
         (id, date, statut, champ, avant, apres, raison, impact, "baseLegale", "sourceId")
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         statut=EXCLUDED.statut, avant=EXCLUDED.avant, apres=EXCLUDED.apres,
         raison=EXCLUDED.raison, impact=EXCLUDED.impact, "baseLegale"=EXCLUDED."baseLegale",
         "sourceId"=EXCLUDED."sourceId"`,
      [c.id, c.date, c.statut, c.champ, JSON.stringify(c.avant), JSON.stringify(c.apres),
       c.raison, c.impact, c.baseLegale, c.sourceId]
    );
  }

  await client.query('COMMIT');

  const r = await client.query(`
    SELECT 'source' AS t, count(*) FROM seuils_source
    UNION ALL SELECT 'parametre', count(*) FROM seuils_parametre
    UNION ALL SELECT 'changement', count(*) FROM seuils_changement
    UNION ALL SELECT 'verification', count(*) FROM seuils_verification
    ORDER BY 1`);
  console.log('Seed termine. Contenu de la base :');
  for (const l of r.rows) console.log(`   ${l.t.padEnd(14)} ${l.count}`);
  await client.end();
} catch (e) {
  try { await client.query('ROLLBACK'); } catch {}
  console.error('ECHEC :', e.code || '', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
