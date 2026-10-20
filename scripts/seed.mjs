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

// Les sources sont declarees dans DEUX fichiers : parametres.json (sources courantes)
// et historique.json (sources propres a une annee passee). Le seed doit les
// fusionner, sinon toute valeur historique pointe vers une source inexistante
// et la contrainte de cle etrangere refuse l'insertion.
const sources = [];
const idsSources = new Set();
for (const s of [...P.sources, ...H.sources]) {
  if (!s || !s.id || !s.nom || idsSources.has(s.id)) continue;
  idsSources.add(s.id);
  sources.push({ id: s.id, nom: s.nom, url: s.url, nature: s.id.split('-')[0] });
}

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

// Seuils de franchise TVA historiques : chaque annee publiee est une annee distincte.
// Les annees sont iterees, jamais en dur : une annee ajoutee dans historique.json
// doit etre seedee sans modifier ce fichier.
for (const [annee, bloc] of Object.entries(H.seuils_tva_franchise.par_annee)) {
  if (typeof bloc !== 'object' || bloc === null) continue;
  for (const [code, v] of Object.entries(bloc)) {
    if (typeof v !== 'object' || v === null) continue;
    const obj = v;
    if (typeof obj.seuil_base !== 'number') continue;
    ajouter('tva_seuil_base_historique', code, code, obj.seuil_base, 'EUR', annee, bloc.source ?? H.seuils_tva_franchise.source);
    ajouter('tva_seuil_majore_historique', code, code, obj.seuil_majore, 'EUR', annee, bloc.source ?? H.seuils_tva_franchise.source);
  }
}

// Seuil de revenu ouvrant droit au versement liberatoire (condition d'acces).
// C'est une condition, pas un taux : elle est publiee comme telle, avec son annee
// d'option et son annee de reference, pour ne pas la confondre avec les taux.
if (P.versement_liberatoire.conditions_revenu) {
  const cond = P.versement_liberatoire.conditions_revenu;
  for (const v of cond.valeurs) {
    ajouter(
      'versement_liberatoire_seuil_revenu',
      `option_${v.option_annee}`,
      `RFR ${v.rfr_annee_reference} par part — option ${v.option_annee}`,
      v.seuil_par_part,
      'EUR_PAR_PART',
      String(v.option_annee),
      cond.source,
      'versement_liberatoire'
    );
    ajouter(
      'versement_liberatoire_seuil_revenu',
      `option_${v.option_annee}_couple`,
      `RFR ${v.rfr_annee_reference} couple (2 parts) — option ${v.option_annee}`,
      v.couple_2_parts,
      'EUR_PAR_PART',
      String(v.option_annee),
      cond.source,
      'versement_liberatoire'
    );
    ajouter(
      'versement_liberatoire_seuil_revenu',
      `option_${v.option_annee}_couple_2_enfants`,
      `RFR ${v.rfr_annee_reference} couple + 2 enfants (3 parts) — option ${v.option_annee}`,
      v.couple_2_enfants_3_parts,
      'EUR_PAR_PART',
      String(v.option_annee),
      cond.source,
      'versement_liberatoire'
    );
  }
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

  // --- purge des lignes qui ne sont plus dans la source -------------------------
  //
  // Un seed idempotent NE suffit pas : il ecrase les lignes dont la cle metier
  // existe toujours, mais il laisse en place les lignes dont la cle a disparu.
  // Concret : en renommant l'annee '2023-2025' en '2023','2024','2025', les
  // anciennes lignes restaient et l'API servait encore l'ancienne valeur 2025.
  // Ici, toute ligne absente de la source est supprimee : la base ne peut
  // jamais contenir une valeur que le depot ne publie pas.
  {
    const cles = parametres.map((p) => [p.categorie, p.code, p.annee, p.regime]);
    const exists = new Set(cles.map((c) => c.join('|')));
    const resultat = await client.query(
      'select categorie, code, annee, regime from seuils_parametre'
    );
    let purges = 0;
    for (const ligne of resultat.rows) {
      const cle = [ligne.categorie, ligne.code, ligne.annee, ligne.regime].join('|');
      if (!exists.has(cle)) {
        await client.query(
          `delete from seuils_parametre
            where categorie=$1 and code=$2 and annee=$3 and regime=$4`,
          [ligne.categorie, ligne.code, ligne.annee, ligne.regime]
        );
        purges++;
      }
    }
    if (purges > 0) console.log(`   ${purges} ligne(s) obsolete(s) supprimee(s)`);
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
