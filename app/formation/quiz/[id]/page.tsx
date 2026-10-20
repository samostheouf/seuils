import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import QuizClient from './QuizClient';
import { trouverModule, MODULES } from '../../../../lib/formation';

export function generateStaticParams() {
  return MODULES.map((m) => ({ id: String(m.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const module = trouverModule(Number(id));
  if (!module) {
    return { title: 'Quiz introuvable — Seuils micro-entrepreneur' };
  }
  return {
    title: `Quiz — Module ${module.id} · ${module.titre}`,
    description: `Quiz de 3 questions : ${module.accroche}`,
    alternates: { canonical: `/formation/quiz/${module.id}` },
    openGraph: {
      type: 'article',
      title: `Quiz — Module ${module.id}`,
      description: module.accroche,
      url: `https://seuils-virid.vercel.app/formation/quiz/${module.id}`,
    },
  };
}

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const module = trouverModule(Number(id));
  if (!module) {
    notFound();
  }
  return <QuizClient moduleId={module.id} />;
}
