// verifier-base.mjs — controle le contenu de la base apres seed.
// Prouve que la base contient ce qu'elle doit contenir, et rien d'autre.
//
// REGLE : les quantites attendues sont CALCULEES depuis data/*.json, jamais ecrites
// en dur. Un 82 en dur devient faux des qu'une valeur est ajoutee, et un controle
// faux est pire qu'un controle absent : il affiche « conforme » sur un ecart.
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

const lireJSON = (nom) => JSON.parse(fs.readFileSync(path.join(RACINE, 'data', nom), 'utf8'));
const P = lireJSON('parametres.json');
const H = lireJSON('historique.json');
const C = lireJSON('changelog.json');

// --- les quantites attendues, calculees depuis la source -------------------------

let attenduParametres = 0;
attenduParametres += P.seuils_micro_fiscal.valeurs.length;
attenduParametres += P.seuils_tva_franchise.valeurs.length * 2;
attenduParametres += P.taux_cotisations_sociales.valeurs.length;
attenduParametres += P.versement_liberatoire.valeurs.length;
attenduParametres += P.acre.valeurs.length * 3;
attenduParametres += P.drom.taux_par_activite.length * 3;
attenduParametres += P.mayotte.taux.length;
for (const vals of Object.values(H.seuils_micro_fiscal.par_annee)) {
  attenduParametres += Object.values(vals).filter((v) => typeof v === 'number').length;
}
for (const bloc of Object.values(H.seuils_tva_franchise.par_annee)) {
  if (typeof bloc !== 'object' || bloc === null) continue;
  for (const v of Object.values(bloc)) {
    if (typeof v === 'object' && v !== null && typeof v.seuil_base === 'number') attenduParametres += 2;
  }
}
if (P.versement_liberatoire.conditions_revenu) {
  attenduParametres += P.versement_liberatoire.conditions_revenu.valeurs.length * 3;
}
// Les sources viennent des deux fichiers (parametres.json + historique.json),
// comme dans le seed. Une source declaree dans l'un et utilisee dans l'autre
// doit compter une seule fois.
const idsSourcesAttendues = new Set([...P.sources, ...H.sources].map((s) => s.id));
const attenduSources = idsSourcesAttendues.size;
const attenduChangements = C.entrees.length;

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
  controle(`${attenduParametres} parametres attendus`, nbP === attenduParametres, `trouve ${nbP}`);

  const [{ count: nbS }] = await c('select count(*)::int as count from seuils_source');
  controle(`${attenduSources} sources attendues`, nbS === attenduSources, `trouve ${nbS}`);

  const [{ count: nbC }] = await c('select count(*)::int as count from seuils_changement');
  controle(`${attenduChangements} changements attendus`, nbC === attenduChangements, `trouve ${nbC}`);

  // Aucune valeur orpheline : toute ligne pointe vers une source existante.
  const orphelins = await c(`select count(*)::int as n from seuils_parametre p
                             left join seuils_source s on s.id = p."sourceId" where s.id is null`);
  controle('aucun parametre sans source', orphelins[0].n === 0, `${orphelins[0].n} orphelin(s)`);

  // Aucune valeur nulle.
  const [{ n: invalides }] = await c('select count(*)::int as n from seuils_parametre where valeur is null');
  controle('aucune valeur nulle', invalides === 0, `${invalides} nulle(s)`);

  // Pas de doublon sur la cle metier.
  const doublons = await c(`select categorie, code, annee, regime, count(*) as n
                            from seuils_parametre group by 1,2,3,4 having count(*) > 1`);
  controle('aucun doublon de cle metier', doublons.length === 0, `${doublons.length} doublon(s)`);

  // --- les valeurs sensibles, relues depuis la source de verite -----------------

  const verifierValeur = async (where, attendu, libelle) => {
    const r = await c(`select valeur from seuils_parametre where ${where}`);
    const ok = r.length === 1 && Math.abs(Number(r[0].valeur) - attendu) < 1e-9;
    controle(libelle, ok, r.length ? String(r[0].valeur) : 'absent');
  };

  await verifierValeur(`categorie='taux_acre' and code='BIC_service' and regime='acre_depuis_2026_07'`,
    15.9, 'taux ACRE services = 15,9 %');
  await verifierValeur(`categorie='seuil_micro_fiscal' and code='BIC_vente' and annee='2026'`,
    203100, 'seuil vente 2026 = 203 100 €');

  // Le correctif du 2025 : les seuils de franchise TVA 2025 sont distincts de 2024.
  // C'est l'erreur que la version precedente publiait (2025 rattache a 2023-2024).
  const tva2025 = await c(`select code, valeur from seuils_parametre
                           where categorie='tva_seuil_base_historique' and annee='2025'`);
  controle('TVA 2025 : 2 categories publiees', tva2025.length === 2, `trouve ${tva2025.length}`);
  const ventes2025 = tva2025.find((r) => r.code === 'ventes_biens_hebergement');
  controle('TVA 2025 ventes = 85 000 € (pas 91 900)',
    !!ventes2025 && Number(ventes2025.valeur) === 85000,
    ventes2025 ? String(ventes2025.valeur) : 'absent');

  // Le seuil de revenu ouvrant droit au versement liberatoire, ajoute en 2026.4.
  const vfl = await c(`select valeur from seuils_parametre
                       where categorie='versement_liberatoire_seuil_revenu'
                         and code='option_2026'`);
  controle('versement liberatoire 2026 = 29 315 €/part',
    vfl.length === 1 && Number(vfl[0].valeur) === 29315,
    vfl.length ? String(vfl[0].valeur) : 'absent');

  // La categorie ACRE ajoutee en 2026.5 : meubles de tourisme classes relevant de la Cipav.
  // Le taux est 3,5 % avant le 1er juillet 2026, 4,5 % a compter de cette date.
  const cipavMeuble = await c(`select valeur, regime from seuils_parametre
                               where categorie='taux_acre' and code='cipav_meuble_classe'`);
  controle('ACRE cipav meuble classe : 2 regimes publies', cipavMeuble.length === 2,
    `trouve ${cipavMeuble.length}`);
  const cmApres = cipavMeuble.find((r) => r.regime === 'acre_depuis_2026_07');
  controle('ACRE cipav meuble classe = 4,5 %', !!cmApres && Number(cmApres.valeur) === 4.5,
    cmApres ? String(cmApres.valeur) : 'absent');

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
