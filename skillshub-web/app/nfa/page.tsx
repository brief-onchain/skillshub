import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SiteFooter from '@/components/SiteFooter';
import NfaWalletPanel from '@/components/NfaWalletPanel';
import NfaDividendPanel from '@/components/NfaDividendPanel';
import NfaChatPanel from '@/components/NfaChatPanel';
import { getNfaPublicConfig } from '@/lib/server/nfa';

const benefitCards = [
  {
    title: '99 Genesis NFA',
    body:
      'The NFA lane is now a tighter genesis drop: 99 total supply, with token IDs 1-10 reserved for team mint and 89 public IDs starting from token ID 11.'
  },
  {
    title: 'Pure BNB Or Combo',
    body:
      'Route A is fixed at 0.099 BNB. Route B is fixed at 0.05 BNB plus the live router quote for 0.099 BNB worth of Skiller sent into treasury.'
  },
  {
    title: 'Chat + Skill Lane',
    body:
      'The holder-facing direction starts with dialogue and skill coordination. The first version already exposes an OpenRouter-backed copilot and optional skill execution context.'
  }
];

const utilityCards = [
  {
    title: 'Mint First, Utility Layer Next',
    body:
      'This contract is deliberately narrow: mint, supply cap, withdraw, metadata. Holder perks and deeper BAP578 operator mechanics stay outside the first deployment.'
  },
  {
    title: 'Explicit 1-10 Reserve',
    body:
      'The odd-ID reservation idea is gone. The contract now hard-reserves token IDs 1-10 for team mint and keeps public mint clean from token ID 11 onward.'
  },
  {
    title: 'Community Trading Is Social Layer',
    body:
      'Secondary-market energy can help bootstrap attention and future skill incubation narratives, but the on-chain contract itself only handles primary mint.'
  }
];

export default function NfaPage() {
  const nfaConfig = getNfaPublicConfig();

  return (
    <main className="min-h-screen bg-bg text-text-main">
      <TopBar />

      <section className="relative overflow-hidden border-b border-white/5 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(240,190,87,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,190,87,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(240,190,87,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

        <div className="container relative z-10 mx-auto px-6 pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.35em] text-gold/80">
                Genesis NFA Lane
              </div>
              <h1 className="mt-6 max-w-4xl font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
                Skill holders get a
                <span className="block bg-gradient-to-r from-gold via-[#ffd48c] to-sky-300 bg-clip-text text-transparent">
                  tighter 99-seat genesis drop
                </span>
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-text-sub">
                The NFA structure changed. We are no longer framing this as the older 177-seat
                preview. The current live direction is a simple Genesis NFA: 99 total supply, the
                first 10 reserved for team-controlled free mint, public mint starting at token ID
                11, and two public payment routes instead of one.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-text-sub/80">
                Wallet interaction now uses wagmi + WalletConnect, with a direct-mint contract path
                ready to plug into a deployed address. The copilot lane is also wired so NFA
                dialogue can start with existing skills as context.
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-panel/70 p-5 backdrop-blur">
                  <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-text-sub/60">
                    Genesis Supply
                  </div>
                  <div className="mt-3 text-3xl font-heading font-bold text-text-main">99</div>
                  <p className="mt-3 text-sm leading-6 text-text-sub">
                    10 reserved IDs plus 89 public IDs.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-panel/70 p-5 backdrop-blur">
                  <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-text-sub/60">
                    Mint Price
                  </div>
                  <div className="mt-3 text-3xl font-heading font-bold text-text-main">0.099 / 0.05 + SKILL</div>
                  <p className="mt-3 text-sm leading-6 text-text-sub">
                    Pure `0.099 BNB`, or `0.05 BNB + Skiller` combo route.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-panel/70 p-5 backdrop-blur">
                  <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-text-sub/60">
                    Public Start
                  </div>
                  <div className="mt-3 text-3xl font-heading font-bold text-text-main">#11</div>
                  <p className="mt-3 text-sm leading-6 text-text-sub">
                    Token IDs `1-10` are reserved for team mint.
                  </p>
                </div>
              </div>
            </div>

            <NfaWalletPanel config={nfaConfig} />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {benefitCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/8 bg-panel/70 p-6"
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-gold/70">
                  Launch Direction
                </div>
                <h2 className="mt-4 text-2xl font-heading font-bold text-text-main">
                  {card.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-text-sub">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[28px] border border-gold/10 bg-panel/60 p-7">
              <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-gold/70">
                Contract Scope
              </div>
              <h2 className="mt-4 text-3xl font-heading font-bold text-text-main">
                Simple ERC721 mint, not a launch kitchen sink
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-7 text-text-sub">
                <p>
                  The first contract should do one thing well: public mint of the Genesis NFA with
                  the correct cap and pricing. No proxy. No mining. No extra vault logic on day one.
                </p>
                <p>
                  That keeps the launch surface easier to verify and easier to explain. More complex
                  BAP578 interactions can be layered later once the holder base exists, while the
                  combo mint route stays a simple router-based quote path instead of a separate
                  owner-maintained token pricing table.
                </p>
                <p>
                  If the contract address is already deployed, this page can mint immediately. If
                  not, the interface still stays aligned with the final parameters so there is no UI
                  rewrite later.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-panel/60 p-7">
              <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-gold/70">
                Current Status
              </div>
              <h2 className="mt-4 text-3xl font-heading font-bold text-text-main">
                Mainnet contract live, mint surface active
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-text-sub">
                <p>WalletConnect and injected-wallet flows are live through wagmi.</p>
                <p>
                  The Genesis NFA contract is already deployed on BSC mainnet, and this page reads
                  supply, treasury, balance, and dividend state directly from chain.
                </p>
                <p>
                  Pure BNB mint and BNB + SKILL combo mint share the same Genesis output. The only
                  difference is which payment route the holder chooses before signing.
                </p>
                {nfaConfig.contractAddress ? (
                  <p className="break-all text-gold/80">
                    Live contract: {nfaConfig.contractAddress}
                  </p>
                ) : null}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-2xl border border-gold/20 px-5 py-3 text-sm font-mono uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold hover:text-white"
                >
                  Back To Hub
                </Link>
                <a
                  href="/#skills"
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-mono uppercase tracking-[0.2em] text-text-sub transition-colors hover:border-gold/30 hover:text-gold"
                >
                  View Live Skills
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {utilityCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/8 bg-panel/60 p-6"
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-gold/70">
                  Utility Notes
                </div>
                <h2 className="mt-4 text-2xl font-heading font-bold text-text-main">
                  {card.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-text-sub">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="mb-10">
            <NfaDividendPanel config={nfaConfig} />
          </div>
          <NfaChatPanel config={nfaConfig} />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
