'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MODULES } from '../../../lib/formation';

// Certificat honnête : il n'est délivré que si les 5 quiz sont validés, et c'est
// l'appareil qui se souvient des validations (localStorage), pas un serveur.
//
// La version précédente générait un certificat sans aucune vérification, sur le
// seul motif d'avoir tapé un nom : un document qui prétend attester une formation
// non suivie. Ici, sans les 5 validations, le certificat reste inaccessible.

const CLE = 'seuils-formations-quiz-valides';

function lireValidations(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const brut = window.localStorage.getItem(CLE);
    const ids: number[] = brut ? JSON.parse(brut) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function ecrireValidations(ids: number[]): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(ids));
  } catch {
    // Le stockage peut être indisponible (navigation privée) : le certificat
    // reste alors inaccessible, sans message trompeur.
  }
}

export default function CertificatPage() {
  const [nom, setNom] = useState('');
  const [valides, setValides] = useState<number[] | null>(null);

  if (valides === null && typeof window !== 'undefined') {
    setValides(lireValidations());
  }

  const tousValides = (valides ?? []).length >= MODULES.length;

  const telecharger = () => {
    if (!tousValides || !nom.trim()) return;
    const date = new Date().toLocaleDateString('fr-FR');
    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Certificat — ${nom.trim()}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:48px 32px;text-align:center;border:3px solid #0b1220">
  <p style="color:#8fa3bf;font-size:13px;letter-spacing:2px;text-transform:uppercase">Seuils micro-entrepreneur</p>
  <h1 style="font-size:34px;margin:18px 0 8px">Certificat de complétion</h1>
  <p style="color:#8fa3bf">Ce certificat atteste que</p>
  <h2 style="font-size:26px;margin:14px 0">${nom.trim()}</h2>
  <p>a complété les ${MODULES.length} modules et obtenu les ${MODULES.length * 3} réponses justes du parcours</p>
  <p style="color:#8fa3bf;font-size:14px;margin-top:26px">Lancer votre activité de micro-entrepreneur — le parcours en 5 étapes</p>
  <p style="color:#8fa3bf;font-size:12.5px">Les valeurs citées sont issues des sources officielles, publiées sur seuils-virid.vercel.app</p>
  <p style="color:#8fa3bf;font-size:12.5px;margin-top:18px">Date : ${date}</p>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificat-micro-entrepreneur.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wrap">
      <p className="note"><Link href="/formation">← Retour à la formation</Link></p>

      <header>
        <h1>Certificat de complétion</h1>
        <p className="sub">
          Le certificat n’est généré que lorsque les {MODULES.length} quiz sont validés.
          Les validations sont conservées sur votre appareil, rien ne part sur un serveur.
        </p>
        <span className="badge">
          {valides === null ? '…' : `${(valides ?? []).length}/${MODULES.length} quiz validés`}
        </span>
      </header>

      <div className="box">
        <h3>Où vous en êtes</h3>
        <p className="note" style={{ margin: 0 }}>
          {tousValides
            ? 'Tous les quiz sont validés. Vous pouvez générer le certificat.'
            : `Encore ${MODULES.length - (valides ?? []).length} quiz à valider. Reprenez le `}
          {!tousValides && <Link href="/formation">parcours →</Link>}
        </p>
      </div>

      {tousValides ? (
        <div className="box">
          <h3>Votre nom sur le certificat</h3>
          <p className="note" style={{ margin: '0 0 12px' }}>Il apparaîtra tel que vous l’écrivez.</p>
          <input
            className="champ"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Votre nom complet"
          />
          <button className="cta" onClick={telecharger} disabled={!nom.trim()}>
            Télécharger le certificat
          </button>
        </div>
      ) : (
        <div className="box">
          <h3>Ce certificat n’est pas encore disponible</h3>
          <p className="note" style={{ margin: 0 }}>
            Un certificat qui s’obtient sans passer les quiz ne prouve rien. Validez les{' '}
            {MODULES.length} quiz pour le débloquer.
          </p>
        </div>
      )}

      <div className="box">
        <h3>Ce que ce certificat dit — et ne dit pas</h3>
        <p className="note" style={{ margin: '0 0 8px' }}>
          Il atteste que les modules ont été lus et les quiz validés sur cet appareil.
        </p>
        <p className="note" style={{ margin: 0 }}>
          Il n’est pas un diplôme, pas une certification professionnelle, et n’engage que
          vous. Les valeurs légales citées viennent des sources officielles listées sur ce site.
        </p>
      </div>
    </div>
  );
}
