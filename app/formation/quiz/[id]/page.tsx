import Link from 'next/link';

export default function QuizPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const questions = [
    { q: 'Quelle est la première étape pour trouver une idée viable ?', options: ['Acheter un nom de domaine', 'Lister les problèmes', 'Créer un site web', 'Engager un développeur'], correct: 1 },
    { q: 'Combien de temps devrait prendre la construction d\'un MVP ?', options: ['1 mois', '3 mois', '7 jours', '1 an'], correct: 2 },
    { q: 'Quel est le prix d\'entrée recommandé pour un site vitrine ?', options: ['99€', '299€', '499-999€', '2000€'], correct: 2 },
    { q: 'Combien de prospects faut-il contacter minimum ?', options: ['10', '20', '50', '100'], correct: 2 },
    { q: 'Quel est le meilleur canal de prospection ?', options: ['Publicité Facebook', 'Téléphone', 'Référencement naturel', 'Influenceurs'], correct: 1 },
  ];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <Link href={`/formation/modules/${id}`} style={{ color: '#0070f3', fontSize: 14 }}>
        ← Retour au module
      </Link>
      <h1 style={{ fontSize: 24, margin: '15px 0' }}>Quiz Module {id}</h1>
      {questions.map((item, i) => (
        <div key={i} style={{ marginBottom: 25, padding: 20, border: '1px solid #e0e0e0', borderRadius: 8 }}>
          <p style={{ fontWeight: 'bold', marginBottom: 12 }}>{i + 1}. {item.q}</p>
          {item.options.map((opt, j) => (
            <label key={j} style={{ display: 'block', marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" name={`q${i}`} value={j} style={{ marginRight: 8 }} />
              {opt}
            </label>
          ))}
        </div>
      ))}
      <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold' }}>
          Score : 5/5 requis pour valider
        </p>
        <p style={{ color: '#666' }}>
          Répondez aux 5 questions pour valider ce module.
        </p>
      </div>
    </div>
  );
}
