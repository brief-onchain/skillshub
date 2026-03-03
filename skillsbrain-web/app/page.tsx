'use client';

import { useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Hero from '@/components/Hero';
import StrategyPanel from '@/components/StrategyPanel';
import SkillsGrid from '@/components/SkillsGrid';
import Playground from '@/components/Playground';
import OssIntake from '@/components/OssIntake';
import InstallGuide from '@/components/InstallGuide';

export default function Home() {
  useEffect(() => {
    // Initial health check
    ApiClient.checkHealth().then(res => {
      console.log('System Health:', res);
    });
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <TopBar />
      <Hero />
      <StrategyPanel />
      <SkillsGrid />
      <Playground />
      <OssIntake />
      <InstallGuide />
      
      <footer className="py-8 bg-bg border-t border-white/5 text-center text-text-sub/40 text-xs font-mono">
        <p>&copy; {new Date().getFullYear()} SKILLSBRAIN. ALL SYSTEMS OPERATIONAL.</p>
      </footer>
    </main>
  );
}
