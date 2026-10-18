import type { Metadata } from 'next';
import './globals.css';

const URL_SITE = 'https://seuils-virid.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: 'Seuils micro-entrepreneur 2026 — données officielles, lisibles par machine',
  description:
    "Seuils, cotisations et TVA du régime micro-entrepreneur. Chaque valeur tracée à sa source officielle, avec l'historique des changements et une API JSON gratuite.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Seuils micro-entrepreneur 2026 — données officielles',
    description:
      "Seuils, cotisations et TVA du régime micro-entrepreneur. Chaque valeur tracée à sa source. API JSON gratuite.",
    url: URL_SITE,
  },
  twitter: { card: 'summary' },
};

// Critical CSS inline — évite le FOUC et accélère le premier rendu.
// Contient uniquement les styles visibles dans le viewport initial.
const criticalCSS = `:root{--bg:#0b1220;--card:#131c2e;--line:#22304a;--txt:#e6edf7;--dim:#8fa3bf;--acc:#4ade80;--warn:#fbbf24}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--txt);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 16px 64px}.wrap{max-width:820px;margin:0 auto}header{padding:48px 0 28px;border-bottom:1px solid var(--line)}h1{font-size:clamp(26px,5vw,38px);line-height:1.15;letter-spacing:-.5px}.sub{color:var(--dim);margin-top:12px;font-size:15px}.badge{display:inline-block;background:rgba(74,222,128,.12);color:var(--acc);border:1px solid rgba(74,222,128,.3);border-radius:999px;padding:3px 11px;font-size:12.5px;font-weight:700;margin-top:16px}h2{font-size:19px;margin:40px 0 6px;letter-spacing:-.2px}.note{color:var(--dim);font-size:14px;margin-bottom:14px}table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:15px}th,td{padding:11px 13px;text-align:left;border-bottom:1px solid var(--line)}th{background:#0f172a;color:var(--dim);font-size:12.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:700}tr:last-child td{border-bottom:0}td.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}.ok{color:var(--acc)}.warn{color:var(--warn)}.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-top:14px}.box.warnbox{border-color:rgba(251,191,36,.35);background:rgba(251,191,36,.06)}.box h3{font-size:15px;margin-bottom:6px}code{background:#0f172a;border:1px solid var(--line);border-radius:6px;padding:2px 7px;font-size:13.5px}a{color:#7dd3fc}.chg{display:flex;gap:14px;padding:13px 0;border-bottom:1px solid var(--line)}.chg:last-child{border-bottom:0}.chg .d{color:var(--dim);font-size:13px;white-space:nowrap;min-width:88px;font-variant-numeric:tabular-nums}.chg .t{font-size:14.5px}.tag{font-size:11px;font-weight:700;border-radius:5px;padding:2px 7px;margin-left:6px;vertical-align:1px}.tag.now{background:rgba(74,222,128,.15);color:var(--acc)}.tag.soon{background:rgba(251,191,36,.15);color:var(--warn)}footer{margin-top:52px;padding-top:22px;border-top:1px solid var(--line);color:var(--dim);font-size:13.5px}footer p+p{margin-top:10px}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        {children}
      </body>
    </html>
  );
}
