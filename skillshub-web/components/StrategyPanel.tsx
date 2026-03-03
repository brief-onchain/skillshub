'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { staggerReveal } from '@/lib/animations';
import { ApiClient } from '@/lib/api';
import { ExcludedDirection } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

export default function StrategyPanel() {
  const { t } = useTranslation();
  const [strategies, setStrategies] = useState<ExcludedDirection[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ApiClient.getCatalog().then((catalog) => {
      setStrategies(catalog.excludedDirections || []);
    });
  }, []);

  useEffect(() => {
    const trigger = containerRef.current || undefined;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.strategy-card');
      staggerReveal(cards, trigger);
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="strategies" className="py-20 bg-bg relative" ref={containerRef}>
      <div className="container mx-auto px-6">
        <div className="mb-12 border-l-4 border-gold pl-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-main mb-2">
            {t.strategy.title}
          </h2>
          <p className="text-text-sub font-mono text-sm">
            {t.strategy.subtitle}
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {strategies.map((item, idx) => (
            <div 
              key={idx}
              className="strategy-card group p-6 bg-panel border border-white/5 hover:border-red-500/30 transition-colors duration-300 opacity-0"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-red-500/70 font-mono text-xs border border-red-500/30 px-2 py-1 rounded">
                  {t.strategy.phaseTag}
                </span>
                <span className="text-text-sub/20 font-heading text-2xl font-bold">
                  0{idx + 1}
                </span>
              </div>
              <h3 className="text-xl font-bold text-text-sub group-hover:text-red-400 transition-colors mb-2">
                {item.slug}
              </h3>
              <p className="text-text-sub/60 text-sm leading-relaxed">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
