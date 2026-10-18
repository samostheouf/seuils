// app/page.tsx — la page humaine.
// Tout vient de la base (ou du snapshot si la base est injoignable) :
// aucune valeur n'est ecrite en dur dans ce fichier.

import { chargerParametres, chargerChangements, chargerSources, chargerMeta, type Parametre } from '../lib/serialisation';

// ISR : la page est générée à la première requête puis servie depuis le edge cache Vercel.
// revalidate=3600 → cache 1h, régénération en arrière-plan sans bloquer les visiteurs.
// C'est LE levier principal contre le cold start : après le 1er hit, TTFB ~50ms.
// NOTE : ne PAS ajouter force-dynamic ici — cela annule revalidate.
export const revalidate = 3600;

const euro = (n: number) => n.toLocaleString('fr-FR') + ' €';
const pct = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1 }) + ' %';

function Lignes({ items, rendu }: { items: Parametre[]; rendu: (p: Parametre) => React.ReactNode }) {
  return <>{items.map((p, i) => <tr key={`${p.categorie}-${p.code}-${p.annee}-${p.regime}-${i}`}>{rendu(p)}</tr>)}</>;

}

export default async function Page() {
  const [params, changements, sources, meta] = await Promise.all([
    chargerParametres(),
    chargerChangements(),
    chargerSources(),
    chargerMeta(),
  ]);

  const P = params.donnees ?? [];
  const C = changements.donnees ?? [];
  const S = sources.donnees ?? [];

  const par = (cat: string, annee = '2026', regime?: string) =>
    P.filter((p) => p.categorie === cat && p.annee === annee && (regime === undefined || p.regime === regime));

  const micro = par('seuil_micro_fiscal');
  const tvaBase = par('tva_seuil_base');
  const tvaMaj = par('tva_seuil_majore');
  const taux = par('taux_cotisation');
  const vl = par('versement_liberatoire');
  const acreAvant = par('taux_acre', '2026', 'acre_avant_2026_07');
  const acreApres = par('taux_acre', '2026', 'acre_depuis_2026_07');
  const drom1 = par('drom_p1');
  const drom2 = par('drom_p2');
  const drom3 = par('drom_p3');
  const mayotte = par('mayotte');
  const histMicro = P.filter((p) => p.categorie === 'seuil_micro_fiscal_historique');

  const anneesHist = Array.from(new Set(histMicro.map((p) => p.annee))).sort();
  const codesHist = Array.from(new Set(histMicro.map((p) => p.code)));
  const valeurHist = (code: string, annee: string) =>
    histMicro.find((p) => p.code === code && p.annee === annee)?.valeur;

  return (
    <div className="wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: 'Paramètres du régime micro-entrepreneur (France)',
            description:
              "Seuils du régime micro-fiscal, franchise en base de TVA, taux de cotisations sociales, ACRE et taux réduits DROM, avec sources officielles et historique des changements.",
            url: 'https://seuils-virid.vercel.app/',
            license: 'https://creativecommons.org/publicdomain/zero/1.0/',
            isAccessibleForFree: true,
            keywords: [
              'micro-entrepreneur',
              'auto-entrepreneur',
              'seuils',
              'TVA',
              'cotisations sociales',
              'ACRE',
              'DROM',
              'France',
            ],
            spatialCoverage: 'FR',
            variableMeasured: P.length,
            distribution: [
              { '@type': 'DataDownload', contentUrl: 'https://seuils-virid.vercel.app/api/v1/parametres.json', encodingFormat: 'application/json' },
              { '@type': 'DataDownload', contentUrl: 'https://seuils-virid.vercel.app/api/v1/changelog.json', encodingFormat: 'application/json' },
              { '@type': 'DataDownload', contentUrl: 'https://seuils-virid.vercel.app/api/v1/sources.json', encodingFormat: 'application/json' },
              { '@type': 'DataDownload', contentUrl: 'https://seuils-virid.vercel.app/api/v1/parametres.csv', encodingFormat: 'text/csv' },
            ],
          }),
        }}
      />
      <header>
        <h1>Seuils du régime micro-entrepreneur</h1>
        <p className="sub">
          Les chiffres officiels français — seuils, cotisations, TVA — chacun tracé à sa source,
          avec l&apos;historique des changements. Lisible par un humain en trente secondes, et par
          une machine via l&apos;API JSON.
        </p>
        <span className="badge">
          {meta?.parametres ?? P.length} valeurs · mise à jour {meta?.miseAJour ?? '—'}
          {params.origine === 'snapshot' ? ' · base injoignable, snapshot servi' : ''}
        </span>
      </header>

      <h2>Seuils du régime micro-fiscal (2026)</h2>
      <p className="note">
        Chiffre d&apos;affaires HT annuel à ne pas dépasser. Le régime n&apos;est pas applicable en N
        si le seuil est dépassé deux années de suite.
      </p>
      <table>
        <tr><th>Activité</th><th style={{ textAlign: 'right' }}>Seuil</th></tr>
        <Lignes items={micro} rendu={(p) => (<><td>{p.libelle}</td><td className="num">{euro(p.valeur)}</td></>)} />
      </table>

      <h2>Franchise en base de TVA (2026)</h2>
      <p className="note">
        La franchise cesse au 1<sup>er</sup> janvier N+1 si le seuil de base est dépassé ; dès le
        1<sup>er</sup> jour du dépassement si le seuil majoré est franchi.
      </p>
      <table>
        <tr><th>Activité</th><th style={{ textAlign: 'right' }}>Seuil de base</th><th style={{ textAlign: 'right' }}>Seuil majoré</th></tr>
        <Lignes
          items={tvaBase}
          rendu={(p) => {
            const maj = tvaMaj.find((m) => m.code === p.code);
            return (<><td>{p.libelle}</td><td className="num">{euro(p.valeur)}</td><td className="num">{maj ? euro(maj.valeur) : '—'}</td></>);
          }}
        />
      </table>
      <div className="box warnbox">
        <h3 className="warn">À retenir pour 2027</h3>
        <p className="note" style={{ margin: 0 }}>
          La mention de franchise sur les factures passe de <code>article 293 B du CGI</code> à{' '}
          <code>article L.233-3 du CIBS</code> au 1<sup>er</sup> janvier 2027 (recodification de la
          TVA). Les modèles de factures et les logiciels de facturation doivent être mis à jour
          avant cette date.
        </p>
      </div>

      <h2>Taux de cotisations sociales (2026)</h2>
      <p className="note">Pourcentage appliqué au chiffre d&apos;affaires déclaré. Aucune cotisation si le chiffre d&apos;affaires est nul.</p>
      <table>
        <tr><th>Activité</th><th style={{ textAlign: 'right' }}>Taux</th></tr>
        <Lignes items={taux} rendu={(p) => (<><td>{p.libelle}</td><td className="num">{pct(p.valeur)}</td></>)} />
      </table>

      <h2>Versement libératoire de l&apos;impôt</h2>
      <p className="note">Option : l&apos;Urssaf collecte l&apos;impôt sur le revenu en même temps que les cotisations.</p>
      <table>
        <tr><th>Activité</th><th style={{ textAlign: 'right' }}>Taux</th></tr>
        <Lignes items={vl} rendu={(p) => (<><td>{p.libelle}</td><td className="num">{pct(p.valeur)}</td></>)} />
      </table>

      <h2>ACRE — exonération de début d&apos;activité</h2>
      <p className="note">
        <strong>Le taux a changé au 1<sup>er</sup> juillet 2026</strong> : le taux minoré est passé de
        50 % à 75 % du taux normal, ce qui divise l&apos;avantage par deux. Une micro-entreprise créée
        avant cette date conserve l&apos;ancien régime.
      </p>
      <table>
        <tr><th>Activité</th><th style={{ textAlign: 'right' }}>Avant 01/07/2026</th><th style={{ textAlign: 'right' }}>Depuis 01/07/2026</th></tr>
        <Lignes
          items={acreApres}
          rendu={(p) => {
            const av = acreAvant.find((a) => a.code === p.code);
            return (<><td>{p.libelle}</td><td className="num" style={{ color: 'var(--dim)' }}>{av ? pct(av.valeur) : '—'}</td><td className="num ok">{pct(p.valeur)}</td></>);
          }}
        />
      </table>
      <div className="box">
        <h3>Conditions</h3>
        <p className="note" style={{ margin: 0 }}>
          Exonération de 25 % si le revenu est inférieur ou égal à 36 045 €, dégressive entre
          36 045 € et 48 060 €, nulle au-delà. Demande à déposer auprès de l&apos;Urssaf au plus tard
          le 60<sup>e</sup> jour suivant l&apos;ouverture de l&apos;activité.
        </p>
      </div>

      <h2>DROM — taux réduits</h2>
      <p className="note">
        Guadeloupe, Martinique, Guyane, La Réunion, Saint-Barthélemy, Saint-Martin.
        <strong> Mayotte relève d&apos;un régime distinct.</strong>
      </p>
      <table>
        <tr><th>Activité</th><th style={{ textAlign: 'right' }}>Jusqu&apos;au 7<sup>e</sup> trim.</th><th style={{ textAlign: 'right' }}>8<sup>e</sup> trim. → fin 3<sup>e</sup> an</th><th style={{ textAlign: 'right' }}>Dès la 4<sup>e</sup> année</th></tr>
        <Lignes
          items={drom1}
          rendu={(p) => {
            const d2 = drom2.find((x) => x.code === p.code);
            const d3 = drom3.find((x) => x.code === p.code);
            return (<><td>{p.libelle}</td><td className="num ok">{pct(p.valeur)}</td><td className="num">{d2 ? pct(d2.valeur) : '—'}</td><td className="num">{d3 ? pct(d3.valeur) : '—'}</td></>);
          }}
        />
      </table>
      <div className="box">
        <h3>Mayotte — régime distinct</h3>
        <p className="note" style={{ margin: 0 }}>
          {mayotte.map((m) => `${m.libelle} ${pct(m.valeur)}`).join(' · ')}
        </p>
      </div>

      <h2>Seuils des années passées</h2>
      <p className="note">
        Pour recalculer une situation, vérifier un dépassement ou corriger un logiciel de facturation.
      </p>
      <table>
        <tr>
          <th>Paramètre</th>
          {anneesHist.map((a) => <th key={a} style={{ textAlign: 'right' }}>{a}</th>)}
        </tr>
        {codesHist.map((code) => (
          <tr key={code}>
            <td>{code}</td>
            {anneesHist.map((a) => {
              const v = valeurHist(code, a);
              return <td key={a} className="num" style={{ color: 'var(--dim)' }}>{v === undefined ? '—' : euro(v)}</td>;
            })}
          </tr>
        ))}
      </table>

      <h2>Historique des changements</h2>
      <p className="note">Ce que ce site conserve et que les autres ne conservent pas.</p>
      <div className="box">
        {C.map((c, i) => (
          <div className="chg" key={`${c.date}-${c.champ}-${i}`}>
            <span className="d">{c.date.split('-').reverse().join('/')}</span>
            <span className="t">
              <strong>{c.champ}</strong> — {c.raison.slice(0, 160)}
              <span className={c.statut === 'A_VENIR' ? 'tag soon' : 'tag now'}>
                {c.statut === 'A_VENIR' ? 'à venir' : 'appliqué'}
              </span>
            </span>
          </div>
        ))}
      </div>

      <h2>API JSON</h2>
      <p className="note">Gratuite, sans clé, sans inscription.</p>
      <div className="box">
        <p className="note" style={{ margin: '0 0 8px' }}><code>GET /api/v1/parametres.json</code> — toutes les valeurs, avec leur source</p>
        <p className="note" style={{ margin: '0 0 8px' }}><code>GET /api/v1/changelog.json</code> — l&apos;historique daté</p>
        <p className="note" style={{ margin: '0 0 8px' }}><code>GET /api/v1/sources.json</code> — les pages officielles</p>
        <p className="note" style={{ margin: 0 }}><code>GET /api/v1/parametres.csv</code> — le même contenu à plat</p>
      </div>

      <footer>
        <p>
          <strong>Sources officielles</strong> — {S.length} pages déclarées : ministère de
          l&apos;Économie, Service Public Entreprendre, Urssaf, impots.gouv.fr, Légifrance.
          Chaque valeur porte l&apos;identifiant de sa source.
        </p>
        <p>
          <strong>Données dans le domaine public</strong> (CC0). Code sous licence MIT :{' '}
          <a href="https://github.com/samostheouf/seuils">github.com/samostheouf/seuils</a>
        </p>
        <p>
          Ce site n&apos;est affilié à aucune administration et ne remplace pas la lecture des textes
          officiels. Une valeur non vérifiée est signalée comme telle — jamais présentée comme certaine.
        </p>
      </footer>
    </div>
  );
}
