'use client';

import { useEffect, useRef } from 'react';
import { fadeInUp } from '@/lib/animations';
import { useTranslation } from '@/lib/i18n';
import gsap from 'gsap';

export default function Hero() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.add(fadeInUp(titleRef.current!, 0.2))
        .add(fadeInUp(subtitleRef.current!, 0.4), "-=0.6")
        .add(fadeInUp(ctaRef.current!, 0.6), "-=0.6");

      // Optional: Subtle background scanline or noise effect could be initialized here
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/5 via-bg to-bg opacity-50" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-panel border border-gold/20 text-gold text-xs font-mono tracking-widest uppercase">
          <span className="w-1.5 h-1.5 bg-gold rounded-full animate-ping" />
          {t.hero.badge}
        </div>

        <h1
          ref={titleRef}
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-text-main mb-6 tracking-tight opacity-0"
        >
          {t.hero.titleLine1} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-dark">
            {t.hero.titleLine2}
          </span>
        </h1>

        <p
          ref={subtitleRef}
          className="max-w-2xl mx-auto text-text-sub text-lg md:text-xl mb-10 leading-relaxed opacity-0"
        >
          {t.hero.subtitle}
          <br className="hidden md:block" />
          {t.hero.subtitleLine2}
        </p>

        <div
          ref={ctaRef}
          className="flex flex-col md:flex-row items-center justify-center gap-4 opacity-0"
        >
          <a
            href="#playground"
            className="px-8 py-4 bg-gold hover:bg-gold-dark text-bg font-bold font-heading tracking-wide rounded clip-path-polygon transition-colors w-full md:w-auto"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
          >
            {t.hero.ctaPlayground}
          </a>
          <a 
            href="#install"
            className="px-8 py-4 bg-transparent border border-gold/30 hover:border-gold text-gold font-mono rounded transition-colors w-full md:w-auto"
          >
            $ npx @skillshub/price-snapshot
          </a>
        </div>
      </div>

      {/* Decorative Grid */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(240,190,87,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,190,87,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
    </section>
  );
}
