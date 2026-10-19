import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Formation Pro — Vendre des sites web aux commerces',
  description: 'Formation complète pour apprendre à vendre des sites web aux commerces de proximité. 5 modules, quiz, certificat et suivi de progression.',
  keywords: ['formation', 'site web', 'commerce', 'entrepreneure', 'freelance'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  <span className="font-bold text-xl text-gray-900">Formation Pro</span>
                </a>
              </div>
              <div className="flex items-center gap-6">
                <a href="/#modules" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
                  Modules
                </a>
                <a href="/certificat" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
                  Certificat
                </a>
                <a
                  href="/#modules"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Commencer
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
