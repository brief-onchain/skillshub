'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { Skill } from '@/lib/types';
import gsap from 'gsap';
import { staggerReveal, hoverLift } from '@/lib/animations';
import { useTranslation } from '@/lib/i18n';

export default function SkillsGrid() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const repoBase = process.env.NEXT_PUBLIC_SKILLS_GITHUB_REPO || '';

  const provenanceLabel = (skill: Skill) => {
    switch (skill.provenance) {
      case 'curated':
        return t.skills.provenanceCurated;
      case 'adapted':
        return t.skills.provenanceAdapted;
      default:
        return t.skills.provenanceOriginal;
    }
  };

  useEffect(() => {
    ApiClient.getSkills().then(setSkills);
  }, []);

  useEffect(() => {
    if (skills.length > 0 && containerRef.current) {
      const trigger = containerRef.current || undefined;
      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>('.skill-card');
        staggerReveal(cards, trigger);
        cards.forEach(card => hoverLift(card));
      }, containerRef);
      return () => ctx.revert();
    }
  }, [skills]);

  return (
    <section id="skills" className="py-24 bg-bg relative" ref={containerRef}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-main mb-4">
              {t.skills.title}
            </h2>
            <p className="text-text-sub max-w-xl">
              {t.skills.subtitle}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-gold font-mono text-xl font-bold">{skills.length} {t.skills.modulesLabel}</div>
            <div className="text-text-sub/50 text-xs uppercase tracking-wider">{t.skills.availableNow}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => {
            const repoUrl =
              repoBase && skill.repoPath
                ? `${repoBase.replace(/\/$/, '')}/tree/main/${skill.repoPath}`
                : '';

            return (
              <div 
                key={skill.id}
                className="skill-card p-8 bg-panel border border-gold/10 relative group overflow-hidden opacity-0"
              >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-gold">
                  <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
                </svg>
              </div>
              
              <div className="mb-6">
                <span className="text-gold/80 text-xs font-mono border border-gold/20 px-2 py-1 rounded uppercase mr-2">
                  {skill.category}
                </span>
                <span className="text-text-sub/70 text-xs font-mono border border-white/10 px-2 py-1 rounded uppercase">
                  {skill.mode || 'live'}
                </span>
                <span className="ml-2 text-text-sub/70 text-xs font-mono border border-white/10 px-2 py-1 rounded uppercase">
                  {provenanceLabel(skill)}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-text-main mb-3 font-heading group-hover:text-gold transition-colors">
                {skill.name}
              </h3>
              
              <p className="text-text-sub text-sm mb-6 min-h-[3rem]">
                {skill.description}
              </p>

              {skill.provenance !== 'original' ? (
                <div className="mb-6 flex flex-col gap-1">
                  <span className="text-[11px] text-text-sub/60 font-mono uppercase">
                    {t.skills.source}: {skill.sourceAttribution || 'Community Open-Source'}
                  </span>
                  <span className="text-[11px] text-text-sub/50 font-mono uppercase">
                    {t.skills.maintainedBy}: {skill.maintainedBy || 'SkillsHub'}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <span className="text-text-sub/40 font-mono text-xs">v{skill.version}</span>
                <span className="text-text-sub/40 font-mono text-[10px] truncate max-w-[12rem]">
                  {skill.installCommand || ''}
                </span>
                <div className="flex items-center gap-3">
                  {repoUrl ? (
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold text-sm font-bold hover:text-white transition-colors"
                    >
                      {t.skills.github}
                    </a>
                  ) : null}
                  <Link
                    href={`/skills/${skill.id}`}
                    className="text-gold text-sm font-bold hover:text-white transition-colors"
                  >
                    {t.skills.details}
                  </Link>
                  <button
                    className="text-gold text-sm font-bold hover:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      const playground = document.getElementById('playground');
                      playground?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {t.skills.tryIt} <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
