'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { ApiClient } from '@/lib/api';
import { Skill } from '@/lib/types';

interface Props {
  params: {
    id: string;
  };
}

export default function SkillDetailPage({ params }: Props) {
  const { t } = useTranslation();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const repoBase = process.env.NEXT_PUBLIC_SKILLS_GITHUB_REPO || '';

  useEffect(() => {
    ApiClient.getSkills().then((skills) => {
      const found = skills.find((s) => s.id === params.id);
      setSkill(found || null);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="text-text-sub font-mono">Loading...</div>
      </main>
    );
  }

  if (!skill) {
    return (
      <main className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-sub mb-4">Skill not found</p>
          <Link href="/" className="text-gold hover:text-white transition-colors">{t.skillDetail.viewAllSkills}</Link>
        </div>
      </main>
    );
  }

  const githubUrl =
    repoBase && skill.repoPath
      ? `${repoBase.replace(/\/$/, '')}/tree/main/${skill.repoPath}`
      : '';

  return (
    <main className="min-h-screen bg-bg text-text-main">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="text-gold font-mono text-sm hover:text-white transition-colors">
          {t.skillDetail.backToIndex}
        </Link>

        <section className="mt-6 p-8 bg-panel border border-gold/20 rounded-xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-mono px-2 py-1 border border-gold/30 rounded text-gold uppercase">
              {skill.category}
            </span>
            <span className="text-xs font-mono px-2 py-1 border border-white/10 rounded text-text-sub uppercase">
              {skill.mode || 'live'}
            </span>
            <span className="text-xs font-mono text-text-sub">v{skill.version}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{skill.name}</h1>
          <p className="text-text-sub mb-8 max-w-3xl">{skill.description}</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-bg border border-white/10 rounded-lg">
              <h2 className="text-gold font-mono text-xs uppercase tracking-wider mb-3">{t.skillDetail.installCommand}</h2>
              <pre className="text-sm font-mono overflow-x-auto">{skill.installCommand || 'npx @skillshub/your-skill'}</pre>
            </div>

            <div className="p-5 bg-bg border border-white/10 rounded-lg">
              <h2 className="text-gold font-mono text-xs uppercase tracking-wider mb-3">{t.skillDetail.exampleInput}</h2>
              <pre className="text-sm font-mono overflow-x-auto">
                {JSON.stringify(skill.inputExample || {}, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/#playground`}
              className="px-5 py-3 bg-gold text-bg font-bold rounded hover:bg-gold-dark transition-colors"
            >
              {t.skillDetail.tryInPlayground}
            </Link>
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 border border-gold/30 text-gold rounded hover:border-gold transition-colors"
              >
                {t.skillDetail.openInGithub}
              </a>
            ) : null}
            <Link
              href="/"
              className="px-5 py-3 border border-gold/30 text-gold rounded hover:border-gold transition-colors"
            >
              {t.skillDetail.viewAllSkills}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
