'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MODULES, trouverModule } from '../../../../lib/formation';

// Quiz côté client : le score reste sur l'appareil, aucune réponse n'est envoyée.
// Les bonnes réponses sont lues par le navigateur (c'est un quiz pédagogique, pas un
// examen sécurisé), mais le verdict est calculé ici, pas affiché dans le HTML.

export default function QuizPage({ moduleId }: { moduleId: number }) {
  const module = trouverModule(moduleId);
  const [reponses, setReponses] = useState<Record<number, number>>({});
  const [valide, setValide] = useState(false);

  if (!module) {
    return (
      <div className="wrap">
        <p className="note"><Link href="/formation">← Retour à la formation</Link></p>
        <h1>Module introuvable</h1>
        <p className="note">Ce quiz n'existe pas.</p>
      </div>
    );
  }

  const total = module.quiz.length;
  const repondues = Object.keys(reponses).length;
  const score = module.quiz.reduce((n, q, i) => n + (reponses[i] === q.correct ? 1 : 0), 0);
  const reussi = valide && score === total;
  const suivant = MODULES.find((m) => m.id === module.id + 1);

  // Une validation reussie est conservee sur l'appareil : c'est ce qui
  // deblocage le certificat. Rien ne part sur un serveur.
  if (reussi && typeof window !== 'undefined') {
    try {
      const brut = window.localStorage.getItem('seuils-formations-quiz-valides');
      const ids: number[] = brut ? JSON.parse(brut) : [];
      if (!ids.includes(module.id)) {
        window.localStorage.setItem('seuils-formations-quiz-valides', JSON.stringify([...ids, module.id]));
      }
    } catch {
      // Stockage indisponible : le quiz reste valide pour cette visite.
    }
  }

  return (
    <div className="wrap">
      <p className="note"><Link href={`/formation/modules/${module.id}`}>← Retour au module</Link></p>

      <header>
        <span className="badge">Quiz · Module {module.id}</span>
        <h1>Quiz — Module {module.id}</h1>
        <p className="sub">3 questions. Le score reste sur votre appareil.</p>
      </header>

      {module.quiz.map((q, i) => (
        <div className="quiz-question" key={i}>
          <p className="quiz-intitule">{i + 1}. {q.question}</p>
          {q.options.map((opt, j) => {
            const choisie = reponses[i] === j;
            const etat = valide ? (j === q.correct ? 'bonne' : choisie ? 'mauvaise' : '') : '';
            return (
              <label className={`quiz-option ${choisie ? 'choisie' : ''} ${etat}`} key={j}>
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={choisie}
                  onChange={() => { setReponses((r) => ({ ...r, [i]: j })); setValide(false); }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      ))}

      <div className="box quiz-verdict">
        {valide ? (
          <>
            <h3>{reussi ? 'Quiz validé' : 'Quiz non validé'}</h3>
            <p className="note" style={{ margin: 0 }}>
              Score : <strong>{score}/{total}</strong>.{' '}
              {reussi
                ? 'Les 3 réponses sont justes.'
                : 'Relisez le module puis recommencez.'}
            </p>
          </>
        ) : (
          <>
            <h3>Valider le quiz</h3>
            <p className="note" style={{ margin: 0 }}>
              {repondues}/{total} question(s) répondue(s).
            </p>
          </>
        )}

        <button
          className="cta"
          onClick={() => setValide(true)}
          disabled={repondues < total}
        >
          Valider mes réponses
        </button>

        {reussi && (
          <div className="quiz-suite">
            {suivant ? (
              <Link className="cta secondaire" href={`/formation/modules/${suivant.id}`}>
                Module {suivant.id} →
              </Link>
            ) : (
              <Link className="cta secondaire" href="/formation/certificat">
                Obtenir le certificat
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
