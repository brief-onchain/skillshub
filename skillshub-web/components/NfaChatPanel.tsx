'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useReadContracts, useSignMessage } from 'wagmi';
import { ApiClient } from '@/lib/api';
import { skillGenesisNfaAbi } from '@/lib/nfa-contract';
import type { NfaPublicConfig } from '@/lib/nfa';
import type { NfaAgentProfile, NfaChatResponse, Skill } from '@/lib/types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export default function NfaChatPanel({ config }: { config: NfaPublicConfig }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [message, setMessage] = useState(
    'Based on the current 99-supply Genesis NFA plan, what should the first holder benefits be?'
  );
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillInput, setSkillInput] = useState('{\n  "symbol": "BNBUSDT"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NfaChatResponse | null>(null);
  const [agentProfile, setAgentProfile] = useState<NfaAgentProfile | null>(null);
  const [agentError, setAgentError] = useState('');

  const hasContract = Boolean(config.contractAddress);
  const contractAddress = (config.contractAddress || ZERO_ADDRESS) as `0x${string}`;
  const balanceQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'balanceOf',
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: hasContract && Boolean(address),
      refetchInterval: 10_000
    }
  });
  const walletBalance =
    typeof balanceQuery.data === 'bigint' ? Number(balanceQuery.data) : 0;
  const ownedTokenContracts =
    hasContract && address
      ? Array.from({ length: walletBalance }, (_, index) => ({
          abi: skillGenesisNfaAbi,
          address: contractAddress,
          functionName: 'tokenOfOwnerByIndex' as const,
          args: [address, BigInt(index)]
        }))
      : [];
  const ownedTokensQuery = useReadContracts({
    contracts: ownedTokenContracts,
    query: {
      enabled: ownedTokenContracts.length > 0,
      refetchInterval: 10_000
    }
  });
  const ownedTokenIds = (ownedTokensQuery.data || [])
    .map((item: any) => {
      if (typeof item === 'bigint') return Number(item);
      if (typeof item?.result === 'bigint') return Number(item.result);
      return null;
    })
    .filter((value: number | null): value is number => value !== null);

  useEffect(() => {
    ApiClient.getSkills().then((data) => {
      setSkills(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedTokenId && ownedTokenIds[0]) {
      setSelectedTokenId(String(ownedTokenIds[0]));
    }
  }, [ownedTokenIds, selectedTokenId]);

  useEffect(() => {
    if (!selectedTokenId) {
      setAgentProfile(null);
      setAgentError('');
      return;
    }

    ApiClient.getNfaAgent(Number(selectedTokenId))
      .then((profile) => {
        setAgentProfile(profile);
        setAgentError('');
      })
      .catch((error) => {
        setAgentProfile(null);
        setAgentError(error instanceof Error ? error.message : 'Failed to load agent profile');
      });
  }, [selectedTokenId]);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (!address) {
        throw new Error('Connect the holder wallet first');
      }
      if (!selectedTokenId) {
        throw new Error('Select or enter a tokenId first');
      }

      const authMessage = [
        'skillhub-nfa-genesis chat auth',
        `wallet: ${address}`,
        `tokenId: ${selectedTokenId}`,
        `timestamp: ${Date.now()}`
      ].join('\n');
      const signature = await signMessageAsync({ message: authMessage });
      const nextSkillInput = selectedSkillId ? JSON.parse(skillInput) : undefined;
      const response = await ApiClient.runNfaChat({
        tokenId: Number(selectedTokenId),
        walletAddress: address,
        signature,
        authMessage,
        message,
        skillId: selectedSkillId || undefined,
        skillInput: nextSkillInput
      });
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Chat request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/8 bg-panel/70 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-gold/70">
            NFA Copilot
          </div>
          <h2 className="mt-3 text-2xl font-heading font-bold text-text-main">
            Holder dialogue + skill-assisted answers
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-text-sub">
          OpenRouter
        </span>
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-text-sub">
        This panel is the first pass of the BAP578-style NFA dialogue lane. You can ask about
        launch structure directly, or attach one existing skill result as context before the model
        responds.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Token ID
            </label>
            <input
              value={selectedTokenId}
              onChange={(event) => setSelectedTokenId(event.target.value)}
              placeholder={ownedTokenIds[0] ? String(ownedTokenIds[0]) : '1'}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-bg/70 p-3 text-sm text-text-main focus:border-gold focus:outline-none"
            />
            <div className="mt-2 text-xs text-text-sub/60">
              {address
                ? ownedTokenIds.length
                  ? `Owned tokenIds: ${ownedTokenIds.join(', ')}`
                  : 'No readable owned tokenIds yet'
                : 'Connect wallet to read owned NFA tokenIds'}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/50 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold/80">
              Agent Profile
            </div>
            {agentProfile ? (
              <div className="mt-3 grid gap-2 text-sm text-text-sub">
                <div>Role: {agentProfile.persona.role}</div>
                <div>Style: {agentProfile.persona.style}</div>
                <div>Expertise: {agentProfile.persona.expertise}</div>
                <div>Active: {agentProfile.state.active ? 'true' : 'false'}</div>
                <div>Trait tone: {agentProfile.persona.traitSet.tone}</div>
                <div>Catchphrase: {agentProfile.persona.traitSet.catchphrase}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-text-sub/60">
                {agentError || 'Select a tokenId to inspect its on-chain agent identity.'}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Prompt
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-2 h-32 w-full rounded-2xl border border-white/10 bg-bg/70 p-4 text-sm text-text-main focus:border-gold focus:outline-none"
            spellCheck={false}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Optional Skill
            </label>
            <select
              value={selectedSkillId}
              onChange={(event) => setSelectedSkillId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-bg/70 p-3 text-sm text-text-main focus:border-gold focus:outline-none"
            >
              <option value="">No skill execution</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} ({skill.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Skill Input JSON
            </label>
            <textarea
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              className="mt-2 h-28 w-full rounded-2xl border border-white/10 bg-bg/70 p-4 font-mono text-sm text-text-main focus:border-gold focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-text-sub/70">
            {address
              ? `Holder wallet: ${address}${selectedTokenId ? ` | tokenId: ${selectedTokenId}` : ''}`
              : 'Wallet context not connected'}
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="rounded-2xl bg-gold px-5 py-3 text-sm font-heading font-bold text-bg transition-colors hover:bg-gold-dark disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Thinking...' : 'Ask Copilot'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-bg/60 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold/80">
            Response
          </span>
          {result?.model ? (
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-sub/60">
              {result.model}
            </span>
          ) : null}
        </div>

        {result ? (
          <div className="mt-4 grid gap-4">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${
                result.success
                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50'
                  : 'border-rose-400/20 bg-rose-400/10 text-rose-100'
              }`}
            >
              {result.success ? result.reply : result.error}
            </div>

            {result.skillResult ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
                  Attached Skill Result
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-all text-xs leading-6 text-text-sub">
                  {JSON.stringify(result.skillResult, null, 2)}
                </pre>
              </div>
            ) : null}

            {result.toolResults ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
                  On-Chain Agent Context
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-all text-xs leading-6 text-text-sub">
                  {JSON.stringify(result.toolResults, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 text-sm text-text-sub/60">
            Select an owned NFA token, sign once per message, then talk to its agent persona.
          </div>
        )}
      </div>
    </div>
  );
}
