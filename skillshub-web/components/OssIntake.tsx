'use client';

import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { OpenSourceCandidate } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

export default function OssIntake() {
  const { t } = useTranslation();
  const [repos, setRepos] = useState<OpenSourceCandidate[]>([]);

  useEffect(() => {
    ApiClient.getCatalog().then((catalog) => {
      setRepos(catalog.openSourceCandidates || []);
    });
  }, []);

  return (
    <section id="oss" className="py-20 bg-bg">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-heading font-bold text-text-main mb-2">{t.oss.title}</h2>
            <p className="text-text-sub">{t.oss.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {repos.map((repo, i) => (
            <div key={i} className="p-6 border border-white/10 hover:border-gold/30 bg-panel transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-text-main group-hover:text-gold transition-colors">{repo.name}</h3>
                <span className="text-xs font-mono text-text-sub/50">{repo.sourceTag}</span>
              </div>
              <p className="text-sm text-text-sub mb-6 min-h-[3rem]">{repo.adaptation}</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                <span className="text-xs font-mono text-text-sub">{t.oss.intakeTrack}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
