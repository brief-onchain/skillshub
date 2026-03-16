import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import { SITE } from '@/lib/site';

const phases = [
  {
    id: 'Phase 1',
    period: '2026 Q1-Q2',
    title: 'Foundation And Product-Market Validation',
    goals: [
      'Stabilize core skill execution for BSC data and contract-assist workflows.',
      'Deliver reproducible outputs for market and BAP578 categories.',
      'Complete baseline operational hardening for production uptime.'
    ],
    deliverables: [
      'SkillsHub web platform with unified playground and skill indexing.',
      'First production skill packs: market intelligence + BAP578 developer kits.',
      'Deployment runbook (GitOps + PM2 + Nginx + TLS) and incident checklist.'
    ],
    kpis: ['p95 API latency < 1.8s for live skills', 'Service uptime >= 99.5%', '12+ launch-ready skills']
  },
  {
    id: 'Phase 2',
    period: '2026 Q2-Q3',
    title: 'Ecosystem Integration And AI Orchestration',
    goals: [
      'Enable low-cost AI-assisted skill validation with production guardrails.',
      'Integrate external tools and curated OSS modules into a consistent interface.',
      'Standardize skill contracts (input/output/error) for third-party contribution.'
    ],
    deliverables: [
      'AI quick-chat verification skill and configurable model routing.',
      'Expanded adapter templates for on-chain games and treasury automation.',
      'Contributor-facing skill authoring guide with quality gates.'
    ],
    kpis: [
      'AI-assisted test success rate >= 95%',
      '20+ skills listed in active catalog',
      'External contributor PR cycle < 5 days'
    ]
  },
  {
    id: 'Phase 3',
    period: '2026 Q3-Q4',
    title: 'Scale, Governance And On-Chain Coordination',
    goals: [
      'Evolve from single-product execution to protocol-grade coordination layer.',
      'Separate Genesis-era equal-share incentives from future Fusion-era weighted rewards.',
      'Introduce transparent roadmap governance and milestone accountability.',
      'Strengthen observability, anomaly detection, and safe rollout practices.'
    ],
    deliverables: [
      'Fusion-ready NFA expansion plan: Genesis keeps equal-share claim logic, while future fused assets move to a separate weighted dividend contract.',
      'Separate Fusion art and metadata system so future fused NFA visuals do not reuse Genesis layers or naming.',
      'Versioned skill governance model and deprecation policy.',
      'Operational dashboards for reliability, cost, and security posture.',
      'Roadmap review cadence with quarterly public milestone updates.'
    ],
    kpis: [
      'Failed deploy rollback < 10 minutes',
      'Monthly incident count reduced by 40%',
      'Roadmap milestone completion >= 85%'
    ]
  },
  {
    id: 'Phase 4',
    period: '2027+',
    title: 'Open Skill Economy',
    goals: [
      'Support a modular, permissionless skill ecosystem for BSC intelligence.',
      'Provide incentives for high-quality skill builders and maintainers.',
      'Enable cross-project composability through stable interfaces.'
    ],
    deliverables: [
      'Plugin-style skill marketplace architecture blueprint.',
      'Reputation and quality scoring framework for skill modules.',
      'Long-term token utility and ecosystem alignment plan.'
    ],
    kpis: ['50+ active skills', '10+ external maintainers', 'Sustained weekly ecosystem integrations']
  }
];

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-bg text-text-main">
      <header className="border-b border-white/10 bg-bg/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gold font-mono text-xs tracking-[0.2em] uppercase">Roadmap</span>
            <h1 className="font-heading text-xl md:text-2xl tracking-wider">SkillsHub Strategic Plan</h1>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <Link href="/" className="px-3 py-1.5 border border-white/10 rounded hover:border-gold/40">
              Back Home
            </Link>
            <a
              href={SITE.twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 border border-white/10 rounded hover:border-gold/40"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-14 pb-10">
        <div className="max-w-5xl">
          <p className="text-gold/80 font-mono text-xs tracking-[0.2em] uppercase mb-4">
            Professional Multi-Phase Execution
          </p>
          <h2 className="font-heading text-4xl md:text-6xl leading-tight mb-6">
            From Skill Toolkit To On-Chain Intelligence Infrastructure
          </h2>
          <p className="text-text-sub text-lg leading-relaxed max-w-4xl">
            SkillsHub will be developed in phased milestones with clear product, engineering, and operations
            objectives. This roadmap is updated incrementally as the ecosystem, partner demand, and on-chain
            execution priorities evolve.
          </p>

          <div className="mt-8 p-4 md:p-5 rounded-xl border border-gold/30 bg-gold/5">
            <div className="text-xs font-mono text-gold uppercase tracking-wider mb-2">On-Chain Identity</div>
            <div className="text-sm md:text-base break-all">
              {SITE.contractAddress ? (
                <>
                  CA:{' '}
                  <a
                    href={SITE.bscscanAddressUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold hover:text-text-main transition-colors"
                  >
                    {SITE.contractAddress}
                  </a>
                </>
              ) : (
                'Genesis NFA contract pending deployment'
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {phases.map((phase) => (
            <article key={phase.id} className="border border-white/10 rounded-2xl bg-panel/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gold font-mono text-xs uppercase tracking-[0.2em]">{phase.id}</span>
                <span className="text-text-sub text-xs font-mono">{phase.period}</span>
              </div>
              <h3 className="font-heading text-2xl mb-5">{phase.title}</h3>

              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-mono uppercase tracking-wider text-gold mb-2">Strategic Goals</h4>
                  <ul className="space-y-2 text-text-sub text-sm">
                    {phase.goals.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-mono uppercase tracking-wider text-gold mb-2">Core Deliverables</h4>
                  <ul className="space-y-2 text-text-sub text-sm">
                    {phase.deliverables.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-mono uppercase tracking-wider text-gold mb-2">Operational KPIs</h4>
                  <ul className="space-y-2 text-text-sub text-sm">
                    {phase.kpis.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
