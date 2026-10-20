import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MODULES, trouverModule } from '../../../../lib/formation';

// Un id hors de la liste des modules n'est PAS une page valide : il doit renvoyer
// 404. La version précédente affichait le module 1 pour n'importe quel id.
export function generateStaticParams() {
  return MODULES.map((m) => ({ id: String(m.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const module = trouverModule(Number(id));
  if (!module) {
    return { title: 'Module introuvable  Seuils micro-entrepreneur' };
  }
  return {
    title: `Module ${module.id}  ${module.titre}`,
    description: module.accroche,
    alternates: { canonical: `/formation/modules/${module.id}` },
    openGraph: {
      type: 'article',
      title: `Module ${module.id}  ${module.titre}`,
      description: module.accroche,
      url: `https://seuils-virid.vercel.app/formation/modules/${module.id}`,
    },
  };
}

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const module = trouverModule(Number(id));
  if (!module) {
    notFound();
  }

  const suivant = MODULES.find((m) => m.id === module.id + 1);

  return (
    <div className="wrap">
      <p className="note">
        <Link href="/formation"> Retour  la formation</Link>
      </p>

      <header>
        <span className="badge">Module {module.id} / {MODULES.length}</span>
        <h1>{module.titre}</h1>
        <p className="sub">{module.accroche}</p>
      </header>

      <div className="module-contenu">
        {module.contenu.map((ligne, i) =>
          ligne === '' ? (
            <div className="module-sep" key={i} />
          ) : (
            <p key={i}>{ligne}</p>
          )
        )}
      </div>

      <div className="box">
        <h3>Les chiffres cits</h3>
        <p className="note" style={{ margin: 0 }}>
          Les seuils, taux et dates de ce module viennent de la base du site. Retrouvez la valeur
          exacte et sa source sur la <Link href="/">page daccueil</Link>, dans le
          <Link href="/api/v1/parametres.json"> JSON</Link> ou dans le
          <Link href="/api/v1/changelog.json"> changelog</Link>.
        </p>
      </div>

      <div className="nav-modules">
        <Link className="cta" href={`/formation/quiz/${module.id}`}>Passer le quiz</Link>
        {suivant ? (
          <Link className="cta secondaire" href={`/formation/modules/${suivant.id}`}>
            Module {suivant.id} 
          </Link>
        ) : (
          <Link className="cta secondaire" href="/formation/certificat">Obtenir le certificat</Link>
        )}
      </div>
    </div>
  );
}
