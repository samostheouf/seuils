import Link from 'next/link';
import type { Metadata } from 'next';
import { MODULES, TITRE_FORMATION, SOUS_TITRE_FORMATION, INTRODUCTION_FORMATION } from '../../lib/formation';

export const metadata: Metadata = {
  title: TITRE_FORMATION,
  description:
    'Le parcours en 5 étapes pour lancer et tenir une activité de micro-entrepreneur : seuils, cotisations, TVA, ACRE et historique des changements.',
  alternates: { canonical: '/formation' },
  openGraph: {
    type: 'article',
    title: TITRE_FORMATION,
    description: SOUS_TITRE_FORMATION,
    url: 'https://seuils-virid.vercel.app/formation',
  },
};

export default function FormationPage() {
  return (
    <div className="wrap">
      <header>
        <h1>{TITRE_FORMATION}</h1>
        <p className="sub">{SOUS_TITRE_FORMATION}</p>
        <span className="badge">{MODULES.length} modules · quiz par module · données sourcées</span>
      </header>

      <div className="box">
        <h3>Pourquoi ce parcours</h3>
        {INTRODUCTION_FORMATION.map((p, i) => (
          <p className="note" key={i} style={{ margin: i === INTRODUCTION_FORMATION.length - 1 ? 0 : '0 0 10px' }}>
            {p}
          </p>
        ))}
      </div>

      <h2>Les modules</h2>
      <p className="note">Chaque module se termine par un quiz de 3 questions. Les réponses ne quittent pas votre appareil.</p>

      <div className="modules">
        {MODULES.map((m) => (
          <Link className="module" key={m.id} href={`/formation/modules/${m.id}`}>
            <h3>Module {m.id} — {m.titre}</h3>
            <p>{m.accroche}</p>
            <span className="module-cta">Commencer →</span>
          </Link>
        ))}
      </div>

      <h2>Après les 5 modules</h2>
      <p className="note">
        Le certificat atteste que vous avez lu les modules et obtenu les 3 bonnes réponses à chaque quiz.
        Il n’est pas indexé par les moteurs de recherche.
      </p>
      <div className="box">
        <p className="note" style={{ margin: 0 }}>
          <Link href="/formation/certificat">Accéder au certificat →</Link>
        </p>
      </div>

      <footer>
        <p>
          <strong>Données citées</strong> — chaque seuil, taux et date vient de la base du site et porte
          l’identifiant de sa source officielle. Le certificat ne se base que sur les quiz de ce parcours.
        </p>
      </footer>
    </div>
  );
}
