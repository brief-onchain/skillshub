'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { SITE } from '@/lib/site';

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="py-8 bg-bg border-t border-white/5 text-xs font-mono">
      <div className="container mx-auto px-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-text-sub/70">
          &copy; {new Date().getFullYear()} {t.footer.copyright}
        </p>

        <div className="flex flex-col gap-2 text-text-sub/80 md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gold">CA:</span>
            {SITE.contractAddress ? (
              <a
                href={SITE.bscscanAddressUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-gold transition-colors break-all"
              >
                {SITE.contractAddress}
              </a>
            ) : (
              <span className="text-text-sub/50">Pending Genesis NFA deployment</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/roadmap" className="hover:text-gold transition-colors">
              {t.topbar.navRoadmap}
            </Link>
            <a
              href={SITE.twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-gold transition-colors"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
