'use client';

import Link from 'next/link';
import { useTranslation, Locale } from '@/lib/i18n';

export default function TopBar() {
  const { t, locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh' : 'en' as Locale);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gold rounded-sm animate-pulse" />
          <span className="font-heading font-bold text-xl tracking-wider text-text-main">
            {t.topbar.brand}<span className="text-gold">{t.topbar.brandHighlight}</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-mono text-text-sub">
          <Link href="#strategies" className="hover:text-gold transition-colors">{t.topbar.navStrategies}</Link>
          <Link href="#skills" className="hover:text-gold transition-colors">{t.topbar.navSkills}</Link>
          <Link href="#playground" className="hover:text-gold transition-colors">{t.topbar.navPlayground}</Link>
          <Link href="#oss" className="hover:text-gold transition-colors">{t.topbar.navOss}</Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleLocale}
            className="px-3 py-1 rounded bg-panel border border-white/10 text-xs font-mono text-text-sub hover:text-gold hover:border-gold/30 transition-colors"
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-panel border border-white/10 text-xs font-mono text-gold">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {t.topbar.systemOnline}
          </div>
        </div>
      </div>
    </nav>
  );
}
