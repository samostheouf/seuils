import Link from "next/link";

export default function ModulePage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const modules = [
    { id: 1, title: "Identifier une idée viable", content: [
      "Objectif : Trouver un problème réel que les gens paient pour résoudre.",
      "",
      "Étape 1 : Lister les problèmes (30 min)",
      "Notez 10 problèmes que vous observez autour de vous.",
      "",
      "Étape 2 : Validar la douleur (30 min)",
      "Pour chaque problème : les gens en parlent-ils ? Ils paient déjà une solution ?",
      "",
      "Étape 3 : Choisir le problème (10 min)",
      "Critères : un maximum de « oui », vous pouvez le résoudre avec un site web.",
      "",
      "Étape 4 : Définir le client idéal (15 min)",
      "Qui est-il ? Métier, âge, où le trouver, budget estimé.",
      "",
      "Exercice : Écrivez en 1 phrase votre promesse de valeur.",
    ].join("\n")},
    { id: 2, title: "Construire un MVP", content: [
      "Objectif : Avoir un produit fonctionnel en 7 jours, pas plus.",
      "",
      "Qu&apos;est-ce qu&apos;un MVP : la version la plus simple possible qui résout le problème principal.",
      "",
      "Définir la promesse (15 min) : une phrase qui dit exactement ce que fait le produit.",
      "",
      "Choisir les outils (30 min) : Next.js + Vercel (0€), Prisma (0€), Stripe (%).",
      "",
      "Structure du projet : app/, lib/, data/, scripts/, README.md",
      "",
      "Page d&apos;accueil qui vend : H1 + 3 bénéfices + preuve + CTA + tarif.",
      "",
      "Tarification : 499-999€ pour un site vitrine. Offre découverte à 299€.",
    ].join("\n")},
    { id: 3, title: "Déployer en production", content: [
      "Objectif : Votre produit est accessible par n&apos;importe qui, n&apos;importe où.",
      "",
      "Creer le projet Vercel (10 min) : vercel.com, GitHub, Add New Project.",
      "",
      "Nom de domaine (30 min) : OVH, 8-15€/an, .fr ou .com.",
      "",
      "HTTPS automatique : Vercel génère le certificat SSL automatiquement.",
      "",
      "Page 404 personnalisée : app/not-found.tsx.",
      "",
      "SEO de base : title, description, canonical dans layout.tsx.",
      "",
      "Sitemap : app/sitemap.ts avec toutes les URLs.",
      "",
      "Robots.txt : app/robots.ts avec le sitemap.",
    ].join("\n")},
    { id: 4, title: "Attirer vos premiers clientes", content: [
      "Objectif : 3 clientes payantes en 7 jours, sans publicité.",
      "",
      "Liste de prospects (1 heure) : 50 prospects minimum.",
      "Commerces de proximité, Google Maps, groupes Facebook.",
      "",
      "Approche directe (2 heures) : Téléphone, email, visite en personne.",
      "Script : « Bonjour, je suis [prénom], je fais des sites vitrines pour les commerces. »",
      "",
      "Gérer les objections (30 min) : « C&apos;est trop cher », « Je n&apos;ai pas besoin ».",
      "",
      "Clôturer la vente (15 min) : Prix + livraison + paiement, acompte 50%.",
      "",
      "Témoignages (15 min) : Demander photo + phrase après chaque vente.",
    ].join("\n")},
    { id: 5, title: "Automatiser et scaler", content: [
      "Objectif : Votre produit continue de vendre pendant que vous dormez.",
      "",
      "Automatiser la prospection (1 heure) : Google Sheets + Gmail.",
      "",
      "Système de recommandation (30 min) : 10% de réduction par recommandation.",
      "",
      "Produits complémentaires (1 heure) : Maintenance 29€/mois, SEO 99€/mois.",
      "",
      "Mesurer (15 min) : Prospects contactés, taux de conversion, revenu mensuel.",
      "",
      "Scaler : Déléguer la création, garder la prospection, 299€ de marge par site.",
    ].join("\n")},
  ];

  const mod = modules.find(m => m.id === id) || modules[0];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px", fontFamily: "system-ui" }}>
      <Link href="/formation" style={{ color: "#0070f3", fontSize: 14 }}>
        ← Retour à la formation
      </Link>
      <h1 style={{ fontSize: 24, margin: "15px 0" }}>Module {mod.id} : {mod.title}</h1>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#333", fontSize: 15 }}>
        {mod.content}
      </div>
      <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
        <Link href={`/formation/quiz/${id}`} style={{ padding: "12px 24px", background: "#0070f3", color: "white", borderRadius: 6, textDecoration: "none", fontWeight: "bold" }}>
          Passer le quiz
        </Link>
        {id < 5 ? (
          <Link href={`/formation/modules/${id + 1}`} style={{ padding: "12px 24px", background: "#f0f0f0", color: "#333", borderRadius: 6, textDecoration: "none" }}>
            Module suivant →
          </Link>
        ) : (
          <Link href="/formation/certificat" style={{ padding: "12px 24px", background: "#10b981", color: "white", borderRadius: 6, textDecoration: "none", fontWeight: "bold" }}>
            Obtenir le certificat
          </Link>
        )}
      </div>
    </div>
  );
}
