import Link from 'next/link';

export default function FormationPage() {
  const modules = [
    { id: 1, title: 'Identifier une idée viable', desc: 'Trouver un problème réel que les gens paient pour résoudre' },
    { id: 2, title: 'Construire un MVP', desc: 'Avoir un produit fonctionnel en 7 jours, pas plus' },
    { id: 3, title: 'Déployer en production', desc: 'Votre produit est accessible par n\'importe qui' },
    { id: 4, title: 'Attirer vos premiers clients', desc: '3 clients payants en 7 jours, sans publicité' },
    { id: 5, title: 'Automatiser et scaler', desc: 'Votre produit continue de vendre pendant que vous dormez' },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Formation : Lancer un projet numérique avec l'IA</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>
        5 modules complets pour passer de l'idée au produit fini en 7 jours.
      </p>

      <div style={{ display: 'grid', gap: 15 }}>
        {modules.map(m => (
          <Link key={m.id} href={`/formation/modules/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 20, border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Module {m.id} : {m.title}</h3>
              <p style={{ margin: 0, color: '#666' }}>{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
        <h2 style={{ fontSize: 20, marginBottom: 10 }}>Certificat de complétion</h2>
        <p>Obtenez votre certificat PDF après avoir terminé les 5 modules et quiz.</p>
        <Link href="/formation/certificat" style={{ color: '#0070f3' }}>
          Accéder au certificat
        </Link>
      </div>
    </div>
  );
}
