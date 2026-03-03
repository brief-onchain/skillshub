'use client';

import Link from 'next/link';
import { useTranslation, Locale } from '@/lib/i18n';
import { Logo } from './Logo';

export default function TopBar() {
  const { t, locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh' : 'en' as Locale);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3.5 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Logo className="w-10 h-10 relative z-10 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl tracking-widest text-text-main leading-none group-hover:text-gold transition-colors duration-300">
              {t.topbar.brand}<span className="text-gold">{t.topbar.brandHighlight}</span>
            </span>
            <span className="text-[9px] font-mono text-text-sub/40 tracking-[0.25em] leading-none mt-1 uppercase">
              Agent Network
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-mono font-bold tracking-widest text-text-sub">
          {[
            { href: '#strategies', label: t.topbar.navStrategies },
            { href: '#skills', label: t.topbar.navSkills },
            { href: '#playground', label: t.topbar.navPlayground },
            { href: '#oss', label: t.topbar.navOss },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative py-2 hover:text-gold transition-colors group/nav"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover/nav:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-text-sub hover:text-gold hover:border-gold/30 transition-all"
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gold/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {t.topbar.systemOnline}
          </div>
        </div>
      </div>
    </nav>
  );
}
