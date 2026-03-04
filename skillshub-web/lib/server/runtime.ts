import { loadSkillIds } from '@/lib/server/catalog';
import { getLlmConfig, getRpcEndpoints } from '@/lib/server/env';
import czStyleProfile from '@/lib/server/data/cz_style_profile.json';
import type { PlaygroundRequest, PlaygroundResponse } from '@/lib/types';

function normalizeSymbol(value: unknown, fallback = 'BTCUSDT') {
  return String(value || fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function fetchJson(url: string, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'skillshub-web/0.1.0' }
    });
    if (!response.ok) {
      throw new Error(`Upstream ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRpc(endpoint: string, method: string, params: unknown[] = [], timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'skillshub-web/0.1.0'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`RPC upstream ${response.status}`);
    }

    const parsed = await response.json();
    if (parsed?.error) {
      const msg = parsed.error?.message || JSON.stringify(parsed.error);
      throw new Error(`RPC error: ${msg}`);
    }
    return parsed?.result;
  } finally {
    clearTimeout(timer);
  }
}

function toHexNumber(value: unknown) {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return Number.parseInt(value, 16);
  }
  return Number(value || 0);
}

function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function extractChatReply(parsed: any) {
  let reply = parsed?.choices?.[0]?.message?.content;
  if (Array.isArray(reply)) {
    reply = reply
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }
  if (!reply || typeof reply !== 'string') {
    throw new Error('LLM response missing message content');
  }
  return reply;
}

async function callLlmChat(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const llm = getLlmConfig();
  if (!llm.apiKey) {
    throw new Error(
      'Missing LLM API key. Set OPENROUTER_API_KEY (or OPENAI_API_KEY/AI_API_KEY) in server env.'
    );
  }

  const endpoint = `${llm.apiBase.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user }
      ]
    })
  });

  const raw = await response.text();
  let parsed: any;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }

  if (!response.ok) {
    const msg =
      parsed?.error?.message ||
      parsed?.error ||
      `LLM API failed with status ${response.status}`;
    throw new Error(String(msg));
  }

  return {
    model: llm.model,
    parsed,
    reply: extractChatReply(parsed)
  };
}

async function runAiQuickChat(input: Record<string, unknown>) {
  const prompt = String(input.prompt || input.message || '只回复一句: AI通了').trim();
  if (!prompt) {
    throw new Error('prompt is required');
  }

  const out = await callLlmChat({
    system: 'You are a concise SkillsHub verification assistant. Reply in the same language as the user.',
    user: prompt,
    temperature: 0.2,
    maxTokens: 120
  });

  return {
    provider: 'openrouter-compatible',
    model: out.model,
    prompt,
    reply: out.reply
  };
}

async function runCzStyleRewrite(input: Record<string, unknown>) {
  const modeInput = String(input.mode || 'rewrite').toLowerCase();
  const mode: 'rewrite' | 'generate' = modeInput === 'generate' ? 'generate' : 'rewrite';
  const languageInput = String(input.language || 'auto').toLowerCase();
  const language: 'zh' | 'en' | 'auto' =
    languageInput === 'zh' || languageInput === 'en' ? languageInput : 'auto';
  const maxChars = Math.max(80, Math.min(500, Number(input.maxChars || 220)));
  const toneStrength = Math.max(1, Math.min(5, Number(input.toneStrength || 3)));

  const draft = String(input.draft || '').trim();
  const topic = String(input.topic || '').trim();
  if (mode === 'rewrite' && !draft) {
    throw new Error('draft is required when mode=rewrite');
  }
  if (mode === 'generate' && !topic) {
    throw new Error('topic is required when mode=generate');
  }

  const profile = (czStyleProfile as any)?.speaker || {};
  const topWords = (profile.top_words || [])
    .slice(0, 10)
    .map((x: any) => x.term)
    .filter(Boolean)
    .join(', ');
  const topCn = (profile.top_cn_phrases || [])
    .slice(0, 8)
    .map((x: any) => x.term)
    .filter(Boolean)
    .join('，');
  const cues = (profile.style_cues || []).join('; ');

  const system = [
    'You are a style-rewrite assistant for a crypto operations team.',
    'Task: produce a new post inspired by CZ communication style from historical public posts.',
    'Do NOT claim to be CZ. Do NOT fabricate facts, deals, or promises.',
    'Keep concise, operator-like, outcome-oriented tone with high clarity.',
    `Target length: <= ${maxChars} chars.`,
    `Tone strength: ${toneStrength}/5.`,
    `Language target: ${language}.`,
    `Profile cues: ${cues || 'concise, decisive, pragmatic'}.`,
    `Profile top words: ${topWords || 'N/A'}.`,
    `Profile top CN phrases: ${topCn || 'N/A'}.`
  ].join(' ');

  const user = mode === 'rewrite'
    ? `Rewrite this draft into CZ-inspired style:\n${draft}`
    : `Generate one CZ-inspired post about this topic:\n${topic}`;

  const out = await callLlmChat({
    system,
    user,
    temperature: 0.35,
    maxTokens: 220
  });

  return {
    provider: 'openrouter-compatible',
    model: out.model,
    mode,
    language,
    maxChars,
    toneStrength,
    profileStats: {
      count: profile.count || 0,
      avgChars: profile.avg_chars || null
    },
    output: out.reply
  };
}

function fallbackPriceSnapshot(symbol: string) {
  return {
    symbol,
    lastPrice: symbol === 'BTCUSDT' ? 90000 : 100,
    changePercent24h: 1.25,
    high24h: symbol === 'BTCUSDT' ? 91500 : 105,
    low24h: symbol === 'BTCUSDT' ? 88500 : 95,
    quoteVolume24h: 120000000
  };
}

function fallbackTopMovers(quoteAsset: string, limit: number, sortBy: 'change' | 'volume') {
  const seed = [
    { symbol: `BTC${quoteAsset}`, lastPrice: 90000, changePercent24h: 1.2, quoteVolume24h: 1020000000 },
    { symbol: `ETH${quoteAsset}`, lastPrice: 2400, changePercent24h: 2.8, quoteVolume24h: 640000000 },
    { symbol: `BNB${quoteAsset}`, lastPrice: 620, changePercent24h: 1.9, quoteVolume24h: 320000000 }
  ];
  const sorted =
    sortBy === 'volume'
      ? seed.sort((a, b) => b.quoteVolume24h - a.quoteVolume24h)
      : seed.sort((a, b) => b.changePercent24h - a.changePercent24h);
  return {
    quoteAsset,
    sortBy,
    movers: sorted.slice(0, Math.max(1, Math.min(limit, sorted.length)))
  };
}

function fallbackFundingWatch(symbol: string) {
  const markPrice = symbol === 'BTCUSDT' ? 90010 : 100;
  const indexPrice = symbol === 'BTCUSDT' ? 89995 : 99.8;
  const fundingRate = 0.0001;
  const basisBps = Number((((markPrice - indexPrice) / indexPrice) * 10000).toFixed(2));
  const annualizedFundingRate = Number((fundingRate * 3 * 365 * 100).toFixed(2));
  return {
    symbol,
    markPrice,
    indexPrice,
    fundingRate,
    annualizedFundingRate,
    basisBps,
    nextFundingTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    timeUntilFundingMinutes: 240
  };
}

function fallbackSymbolStatus(symbol: string, includeFilters: boolean) {
  const baseAsset = symbol.replace(/USDT$/, '') || symbol;
  return {
    symbol,
    status: 'TRADING',
    baseAsset,
    quoteAsset: 'USDT',
    isSpotTradingAllowed: true,
    isMarginTradingAllowed: true,
    filters: includeFilters
      ? [
          { filterType: 'PRICE_FILTER', tickSize: '0.01' },
          { filterType: 'LOT_SIZE', stepSize: '0.001', minQty: '0.001' },
          { filterType: 'MIN_NOTIONAL', minNotional: '5' }
        ]
      : undefined
  };
}

function fallbackKlineBrief(symbol: string, interval: string, limit: number) {
  return {
    symbol,
    interval,
    candles: limit,
    trendPercent: 1.43,
    latestCandle: {
      openTime: new Date().toISOString(),
      open: 610,
      high: 625,
      low: 605,
      close: 619,
      volume: 15800
    }
  };
}

function fallbackOpenInterestScan(symbol: string, period: string) {
  return {
    source: 'fallback',
    symbol,
    period,
    openInterestContracts: 125000,
    openInterestChange: 2200,
    openInterestChangePercent: 1.79,
    takerBuySellRatio: 1.08,
    riskFlag: 'normal',
    note: 'Binance futures endpoints unavailable; showing fallback snapshot.'
  };
}

function fallbackRpcFanout(method: string, endpoints: string[]) {
  const picked = endpoints[0] || 'https://bsc-dataseed.binance.org/';
  return {
    source: 'fallback',
    method,
    healthiestEndpoint: picked,
    healthyEndpoints: 1,
    totalEndpoints: Math.max(1, endpoints.length),
    latestBlock: 42000000,
    maxBlockDrift: 0,
    note: 'RPC probes unavailable; showing fallback health snapshot.'
  };
}

async function runOpenInterestScan(input: Record<string, unknown>) {
  const symbol = normalizeSymbol(input.symbol || 'BTCUSDT');
  const allowedPeriods = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
  const periodInput = String(input.period || '5m');
  const period = allowedPeriods.includes(periodInput) ? periodInput : '5m';
  const limit = Math.max(2, Math.min(30, Number(input.limit || 2)));

  let snapshot: any = null;
  let hist: any[] = [];
  let taker: any[] = [];
  let premium: any = null;
  try {
    const [snapshotRes, histRes, takerRes, premiumRes] = await Promise.allSettled([
      fetchJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`),
      fetchJson(
        `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`
      ),
      fetchJson(
        `https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${symbol}&period=${period}&limit=${limit}`
      ),
      fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`)
    ]);

    if (snapshotRes.status === 'fulfilled') snapshot = snapshotRes.value;
    if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) hist = histRes.value;
    if (takerRes.status === 'fulfilled' && Array.isArray(takerRes.value)) taker = takerRes.value;
    if (premiumRes.status === 'fulfilled') premium = premiumRes.value;
  } catch {
    return fallbackOpenInterestScan(symbol, period);
  }

  if (!snapshot && hist.length === 0) {
    return fallbackOpenInterestScan(symbol, period);
  }

  const latestHist = hist.length ? hist[hist.length - 1] : null;
  const prevHist = hist.length > 1 ? hist[hist.length - 2] : null;
  const openInterestContracts = Number(snapshot?.openInterest ?? latestHist?.sumOpenInterest ?? 0);
  const prevOpenInterest = Number(prevHist?.sumOpenInterest ?? 0);
  const openInterestChange = prevOpenInterest ? openInterestContracts - prevOpenInterest : 0;
  const openInterestChangePercent = prevOpenInterest
    ? Number(((openInterestChange / prevOpenInterest) * 100).toFixed(3))
    : 0;

  const markPrice = Number(premium?.markPrice || 0);
  const openInterestNotionalUsd = markPrice
    ? Number((openInterestContracts * markPrice).toFixed(2))
    : null;

  const latestTaker = taker.length ? taker[taker.length - 1] : null;
  const takerBuySellRatio = Number(latestTaker?.buySellRatio || 0);
  const longShortRatio = Number(latestTaker?.longShortRatio || 0);

  let riskFlag = 'normal';
  const reasons: string[] = [];
  if (Math.abs(openInterestChangePercent) >= 8) {
    riskFlag = 'elevated';
    reasons.push('open_interest_volatility');
  }
  if (openInterestChangePercent > 0 && takerBuySellRatio >= 1.8) {
    riskFlag = 'crowded-long';
    reasons.push('taker_buy_pressure');
  }
  if (openInterestChangePercent > 0 && takerBuySellRatio > 0 && takerBuySellRatio <= 0.55) {
    riskFlag = 'crowded-short';
    reasons.push('taker_sell_pressure');
  }

  return {
    source: 'binance-futures',
    symbol,
    period,
    limit,
    openInterestContracts,
    openInterestNotionalUsd,
    openInterestChange: Number(openInterestChange.toFixed(3)),
    openInterestChangePercent,
    takerBuySellRatio: takerBuySellRatio || null,
    longShortRatio: longShortRatio || null,
    markPrice: markPrice || null,
    snapshotTime: snapshot?.time ? new Date(Number(snapshot.time)).toISOString() : null,
    latestHistTime: latestHist?.timestamp ? new Date(Number(latestHist.timestamp)).toISOString() : null,
    riskFlag,
    riskReasons: reasons
  };
}

async function runBscRpcFanoutCheck(input: Record<string, unknown>) {
  const method = String(input.method || 'eth_blockNumber');
  const params = Array.isArray(input.params) ? input.params : [];
  const timeoutMs = Math.max(1200, Math.min(12000, Number(input.timeoutMs || 4500)));
  const sampleSize = Math.max(1, Math.min(5, Number(input.sampleSize || 2)));
  const blockDriftThreshold = Math.max(0, Math.min(20, Number(input.blockDriftThreshold || 2)));
  const requested = Array.isArray(input.endpoints) ? input.endpoints.map((x) => String(x).trim()).filter(Boolean) : [];
  const endpoints = requested.length ? requested : getRpcEndpoints();

  if (!endpoints.length) {
    return fallbackRpcFanout(method, endpoints);
  }

  const endpointChecks = await Promise.all(
    endpoints.map(async (endpoint) => {
      const latencies: number[] = [];
      let probeResult: unknown = null;
      let blockNumber = 0;
      let chainId = 0;
      let error: string | null = null;

      for (let i = 0; i < sampleSize; i += 1) {
        const started = Date.now();
        try {
          const result = await fetchRpc(endpoint, method, params, timeoutMs);
          const elapsed = Date.now() - started;
          latencies.push(elapsed);
          probeResult = result;
        } catch (err) {
          error = err instanceof Error ? err.message : 'rpc probe failed';
        }
      }

      if (latencies.length) {
        try {
          const [blockHex, chainHex] = await Promise.all([
            fetchRpc(endpoint, 'eth_blockNumber', [], timeoutMs),
            fetchRpc(endpoint, 'eth_chainId', [], timeoutMs)
          ]);
          blockNumber = toHexNumber(blockHex);
          chainId = toHexNumber(chainHex);
        } catch (err) {
          error = err instanceof Error ? err.message : 'rpc metadata probe failed';
        }
      }

      return {
        endpoint,
        ok: latencies.length > 0 && error === null,
        avgLatencyMs: latencies.length
          ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1))
          : null,
        p95LatencyMs: latencies.length ? percentile(latencies, 95) : null,
        chainId: chainId || null,
        blockNumber: blockNumber || null,
        methodResult: probeResult,
        error
      };
    })
  );

  const healthy = endpointChecks.filter((x) => x.ok);
  if (!healthy.length) {
    return fallbackRpcFanout(method, endpoints);
  }

  const blocks = healthy.map((x) => Number(x.blockNumber || 0)).filter((x) => x > 0);
  const maxBlock = blocks.length ? Math.max(...blocks) : 0;
  const minBlock = blocks.length ? Math.min(...blocks) : 0;
  const maxBlockDrift = maxBlock && minBlock ? maxBlock - minBlock : 0;
  const healthiestEndpoint = [...healthy].sort((a, b) => Number(a.avgLatencyMs || 1e9) - Number(b.avgLatencyMs || 1e9))[0];
  const outlierEndpoints = healthy
    .filter((x) => maxBlock - Number(x.blockNumber || 0) > blockDriftThreshold)
    .map((x) => x.endpoint);

  return {
    source: 'bsc-rpc',
    method,
    params,
    sampleSize,
    timeoutMs,
    blockDriftThreshold,
    totalEndpoints: endpointChecks.length,
    healthyEndpoints: healthy.length,
    unhealthyEndpoints: endpointChecks.length - healthy.length,
    healthiestEndpoint: healthiestEndpoint?.endpoint || null,
    latestBlock: maxBlock || null,
    minBlock: minBlock || null,
    maxBlockDrift,
    outlierEndpoints,
    endpoints: endpointChecks
  };
}

function bap578AdapterBlueprint(input: Record<string, unknown>) {
  const contractName = String(input.contractName || 'MyBAP578Adapter');
  const nfaInterface = String(input.nfaInterface || 'INFAOwner');

  const solidityTemplate = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ${nfaInterface} {
  function ownerOf(uint256 tokenId) external view returns (address);
}

interface IAgentVault {
  function creditNative(uint256 tokenId) external payable;
  function debitNative(uint256 tokenId, uint256 amount, address to) external;
}

contract ${contractName} {
  address public immutable nfa;
  IAgentVault public immutable vault;

  modifier onlyOperator(uint256 tokenId) {
    require(${nfaInterface}(nfa).ownerOf(tokenId) == msg.sender, 'not operator');
    _;
  }

  constructor(address nfa_, address vault_) {
    require(nfa_ != address(0) && vault_ != address(0), 'zero address');
    nfa = nfa_;
    vault = IAgentVault(vault_);
  }

  function fund(uint256 tokenId) external payable {
    require(msg.value > 0, 'zero amount');
    vault.creditNative{ value: msg.value }(tokenId);
  }

  function withdraw(uint256 tokenId, uint256 amount, address to) external onlyOperator(tokenId) {
    vault.debitNative(tokenId, amount, to);
  }
}`;

  return {
    summary: 'Generated from FlapBAP578Adapter pattern: token owner acts as agent operator and vault controller is isolated.',
    solidityTemplate,
    checklist: [
      'Keep ownerOf(tokenId) authorization in modifier.',
      'Separate vault balance bookkeeping from adapter business logic.',
      'Emit events for funding/withdrawal/status update.',
      'Add nonReentrant for payable and token transfer functions.',
      'For ERC20 flows, use balance-diff pattern for fee-on-transfer safety.'
    ]
  };
}

function bap578VaultChecklist(input: Record<string, unknown>) {
  const includeTokenFlows = Boolean(input.includeTokenFlows ?? true);
  const items = [
    'Vault controller whitelist: only adapter/game engine contracts can debit.',
    'Token operator auth: use ownerOf(tokenId) as the sole authority.',
    'State bootstrap: initialize agent state lazily and emit event.',
    'Native withdrawal should validate target and amount.',
    'All external token calls should use safe transfer wrappers.'
  ];

  if (includeTokenFlows) {
    items.push('Use transfer-in balance delta, then credit actual received amount.');
    items.push('Reset ERC20 allowance to 0 after controller credit call.');
  }

  return {
    title: 'BAP578 Vault Safety Checklist',
    items,
    source: 'flap-nfa-mint/contracts/arena/FlapBAP578Adapter.sol'
  };
}

function bap578DeployPlan(input: Record<string, unknown>) {
  const network = String(input.network || 'bsc-mainnet');

  return {
    network,
    steps: [
      'Load env from FLAP_ENV_FILE and validate NEXT_PUBLIC_MINER_ADDRESS/TOKEN_ADDRESS.',
      'Deploy ArenaTreasury, NFAVault, FlapBAP578Adapter, CrashEngine in sequence.',
      'Set vault controllers: adapter=true and crashEngine=true.',
      'Set house edge / min bet / allowed assets on crash engine.',
      'Run verify scripts for all contracts and archive tx hashes.'
    ],
    commandTemplate: [
      'npm run compile',
      `npx hardhat run scripts/deploy-arena.js --network ${network}`,
      `npx hardhat run scripts/verify-arena-contracts.js --network ${network}`
    ],
    source: 'flap-nfa-mint/scripts/deploy-arena.js'
  };
}

function bap578TestTemplate(input: Record<string, unknown>) {
  const tokenId = Number(input.tokenId || 1);
  const includeFeeCase = Boolean(input.includeFeeOnTransferCase ?? true);

  const cases = [
    `fund + withdraw native for tokenId ${tokenId}`,
    'fund + withdraw ERC20 via adapter + vault controller',
    'reject withdraw when caller is not token operator',
    'reject direct vault debit from non-controller'
  ];
  if (includeFeeCase) {
    cases.push('fee-on-transfer token should credit actual received amount');
  }

  return {
    title: 'BAP578 Hardhat Test Skeleton',
    mochaBlocks: cases,
    source: 'flap-nfa-mint/test/ArenaFlow.test.js',
    notes: 'Copy structure and fixtures from ArenaFlow to speed up initial test coverage.'
  };
}

function bap578IdeaSprint(input: Record<string, unknown>) {
  const idea = String(input.idea || 'BAP578 game adapter with reward vault');

  return {
    idea,
    deliverables: [
      'Define tokenId-bound ownership and operator permissions.',
      'List required vault credit/debit flows (native + ERC20).',
      'Define events for indexer and monitoring dashboards.',
      'Draft minimal adapter contract with 3-5 functions.',
      'Draft test plan: happy path, auth fail, and balance consistency.'
    ],
    oneDayPlan: {
      hour1: 'Finalize interface + storage layout.',
      hour2to4: 'Implement adapter + deploy script.',
      hour5to6: 'Write core tests and run locally.',
      hour7: 'Publish skill as template in playground.'
    }
  };
}

function fourMemeIntegrationGuide(input: Record<string, unknown>) {
  const command = String(input.command || 'fourmeme create --budget 0.01');
  return {
    skillId: 'four-meme-ai',
    mode: 'integration-guide',
    status: 'manual-review-required',
    commandTemplate: command,
    notes: [
      'Keep this integration in explicit user-confirm mode.',
      'Do not run wallet-signing actions automatically.',
      'Require dry-run and parameter echo before execution.'
    ]
  };
}

function bscNftOpsGuide(input: Record<string, unknown>) {
  const task = String(input.task || 'check_owner');
  const contract = String(input.contract || '0x...');
  const tokenId = Number(input.tokenId || 1);
  return {
    skillId: 'bsc-nft-ops-guide',
    mode: 'guide',
    riskLevel: 'medium',
    task,
    checklist: [
      'Validate contract address format and chain (BSC mainnet/testnet).',
      'Run read-only owner/tokenURI checks before any write action.',
      'For transfers, verify recipient and approval state twice.',
      'Log tx hash + block number for audit trail.'
    ],
    commandHints: {
      ownerCheck: `erc721.ownerOf(${tokenId}) @ ${contract}`,
      metadataCheck: `erc721.tokenURI(${tokenId}) @ ${contract}`
    }
  };
}

function bitagentBondingPlaybook(input: Record<string, unknown>) {
  const action = String(input.action || 'launch');
  const network = String(input.network || 'bsc');
  const symbol = String(input.symbol || 'AGENT');
  return {
    skillId: 'bitagent-bonding-playbook',
    mode: 'guide',
    riskLevel: 'high',
    action,
    network,
    symbol,
    preflight: [
      'Confirm token economics and launch parameters in plain text.',
      'Set strict max budget / max loss before execution.',
      'Run simulation or quote endpoint before signed transaction.'
    ],
    guardrails: [
      'No autonomous key usage.',
      'No repeated retry loops on failed trade transactions.',
      'Always require user confirmation on final payload.'
    ]
  };
}

function multichainPortfolioTrackerGuide(input: Record<string, unknown>) {
  const chains = Array.isArray(input.chains) && input.chains.length
    ? input.chains.map((x) => String(x).toLowerCase())
    : ['bsc', 'eth', 'tron'];
  const wallet = String(input.wallet || '0x...');
  return {
    skillId: 'multichain-portfolio-tracker',
    mode: 'guide',
    riskLevel: 'low',
    chains,
    wallet,
    outputs: [
      'token balances by chain',
      'portfolio allocation percentage',
      'realized/unrealized pnl (if trade history available)',
      'fee/gas attribution summary'
    ],
    implementationPlan: [
      'Collect native + token balances from each chain.',
      'Normalize symbols/decimals and map to quote prices.',
      'Aggregate by asset and compute allocation/pnl.'
    ]
  };
}

function pancakeSwapTradingGuardGuide(input: Record<string, unknown>) {
  const pair = String(input.pair || 'WBNB/USDT');
  const side = String(input.side || 'buy');
  const slippageBps = Math.max(10, Math.min(2000, Number(input.slippageBps || 100)));
  return {
    skillId: 'pancakeswap-trading-guard',
    mode: 'guide',
    riskLevel: 'high',
    pair,
    side,
    slippageBps,
    preTradeChecks: [
      'Liquidity depth check (avoid thin pools).',
      'Price impact estimate and max impact threshold.',
      'Allowance/approval scope minimization.',
      'MEV/sandwich risk awareness at current gas conditions.'
    ],
    failFastRules: [
      'Abort when quote deviates beyond threshold.',
      'Abort when route liquidity drops before submit.',
      'Abort when gas spikes outside configured cap.'
    ]
  };
}

function erc8004AgentRegistryGuide(input: Record<string, unknown>) {
  const chain = String(input.chain || 'bsc');
  const network = String(input.network || 'mainnet');
  const operation = String(input.operation || 'register_agent');
  return {
    skillId: 'erc8004-agent-registry',
    mode: 'guide',
    riskLevel: 'medium',
    chain,
    network,
    operation,
    workflow: [
      'Validate registry contract addresses for selected network.',
      'Prepare identity metadata and ownership controls.',
      'Register identity first, then attach reputation/validation links.',
      'Set monitoring on registry events for state consistency.'
    ],
    postChecks: [
      'ownerOf(tokenId) matches operator wallet',
      'metadata URI reachable and immutable policy documented',
      'event indexer captures registration and updates'
    ]
  };
}

function predictionMarketClobGuide(input: Record<string, unknown>) {
  const market = String(input.market || 'US-election-2028');
  const side = String(input.side || 'YES');
  const strategy = String(input.strategy || 'limit_ladder');
  return {
    skillId: 'prediction-market-clob',
    mode: 'guide',
    riskLevel: 'high',
    market,
    side,
    strategy,
    executionPlan: [
      'Load market metadata and validate settlement rules.',
      'Read orderbook depth and spread before placing orders.',
      'Use staged limit orders instead of single large market order.',
      'Track fills and reconcile position cost basis after each fill.'
    ],
    controls: [
      'position size cap',
      'daily max loss cap',
      'stale order cancellation policy',
      'withdrawal whitelist policy'
    ]
  };
}

async function runLocalSkill(skillId: string, input: Record<string, unknown>) {
  switch (skillId) {
    case 'ai-quick-chat': {
      return runAiQuickChat(input);
    }

    case 'cz-style-rewrite': {
      return runCzStyleRewrite(input);
    }

    case 'price-snapshot': {
      const symbol = normalizeSymbol(input.symbol);
      let ticker: any;
      try {
        ticker = await fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      } catch {
        return fallbackPriceSnapshot(symbol);
      }
      return {
        symbol,
        lastPrice: Number(ticker.lastPrice),
        changePercent24h: Number(ticker.priceChangePercent),
        high24h: Number(ticker.highPrice),
        low24h: Number(ticker.lowPrice),
        quoteVolume24h: Number(ticker.quoteVolume)
      };
    }

    case 'top-movers': {
      const quoteAsset = String(input.quoteAsset || 'USDT').toUpperCase();
      const limit = Math.max(1, Math.min(30, Number(input.limit || 10)));
      const minQuoteVolume = Math.max(0, Number(input.minQuoteVolume || 0));
      const sortByInput = String(input.sortBy || 'change').toLowerCase();
      const sortBy: 'change' | 'volume' = sortByInput === 'volume' ? 'volume' : 'change';
      let all: any[];
      try {
        all = await fetchJson('https://api.binance.com/api/v3/ticker/24hr');
      } catch {
        return fallbackTopMovers(quoteAsset, limit, sortBy);
      }
      const leveragedTokenPattern = /(UP|DOWN|BULL|BEAR)$/;
      const movers = all
        .filter((item: any) => item.symbol?.endsWith?.(quoteAsset))
        .filter((item: any) => !leveragedTokenPattern.test(String(item.symbol)))
        .filter((item: any) => Number(item.quoteVolume) >= minQuoteVolume)
        .map((item: any) => ({
          symbol: item.symbol,
          lastPrice: Number(item.lastPrice),
          changePercent24h: Number(item.priceChangePercent),
          quoteVolume24h: Number(item.quoteVolume)
        }))
        .sort((a: any, b: any) =>
          sortBy === 'volume' ? b.quoteVolume24h - a.quoteVolume24h : b.changePercent24h - a.changePercent24h
        )
        .slice(0, limit);

      return { quoteAsset, minQuoteVolume, sortBy, movers };
    }

    case 'kline-brief': {
      const symbol = normalizeSymbol(input.symbol || 'BNBUSDT');
      const interval = String(input.interval || '15m');
      const limit = Math.max(5, Math.min(200, Number(input.limit || 24)));
      let klines: any[];
      try {
        klines = await fetchJson(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
        );
      } catch {
        return fallbackKlineBrief(symbol, interval, limit);
      }

      const first = klines[0];
      const last = klines[klines.length - 1];
      const open = Number(first[1]);
      const close = Number(last[4]);

      return {
        symbol,
        interval,
        candles: klines.length,
        trendPercent: Number((((close - open) / open) * 100).toFixed(3)),
        latestCandle: {
          openTime: new Date(last[0]).toISOString(),
          open: Number(last[1]),
          high: Number(last[2]),
          low: Number(last[3]),
          close: Number(last[4]),
          volume: Number(last[5])
        }
      };
    }

    case 'funding-watch': {
      const symbol = normalizeSymbol(input.symbol);
      let premium: any;
      try {
        premium = await fetchJson(
          `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
        );
      } catch {
        return fallbackFundingWatch(symbol);
      }

      const nextFundingMs = Number(premium.nextFundingTime || 0);
      const mins = Math.max(0, Math.round((nextFundingMs - Date.now()) / 60000));
      const fundingRate = Number(premium.lastFundingRate);
      const markPrice = Number(premium.markPrice);
      const indexPrice = Number(premium.indexPrice);
      const basisBps = indexPrice
        ? Number((((markPrice - indexPrice) / indexPrice) * 10000).toFixed(2))
        : 0;
      const annualizedFundingRate = Number((fundingRate * 3 * 365 * 100).toFixed(2));

      return {
        symbol,
        markPrice,
        indexPrice,
        fundingRate,
        annualizedFundingRate,
        basisBps,
        nextFundingTime: nextFundingMs ? new Date(nextFundingMs).toISOString() : null,
        timeUntilFundingMinutes: mins
      };
    }

    case 'open-interest-scan': {
      return runOpenInterestScan(input);
    }

    case 'symbol-status': {
      const symbol = normalizeSymbol(input.symbol || 'BNBUSDT');
      const includeFilters = Boolean(input.includeFilters ?? true);
      let info: any;
      try {
        info = await fetchJson(`https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol}`);
      } catch {
        return fallbackSymbolStatus(symbol, includeFilters);
      }

      const raw = info?.symbols?.[0];
      if (!raw) {
        return {
          symbol,
          status: 'UNKNOWN',
          error: `No exchangeInfo record for ${symbol}`
        };
      }

      return {
        symbol,
        status: raw.status,
        baseAsset: raw.baseAsset,
        quoteAsset: raw.quoteAsset,
        isSpotTradingAllowed: Boolean(raw.isSpotTradingAllowed),
        isMarginTradingAllowed: Boolean(raw.isMarginTradingAllowed),
        filters: includeFilters ? raw.filters : undefined
      };
    }

    case 'bsc-rpc-fanout-check': {
      return runBscRpcFanoutCheck(input);
    }

    case 'bap578-adapter-blueprint':
      return bap578AdapterBlueprint(input);

    case 'bap578-vault-checklist':
      return bap578VaultChecklist(input);

    case 'bap578-deploy-plan':
      return bap578DeployPlan(input);

    case 'bap578-test-template':
      return bap578TestTemplate(input);

    case 'bap578-contract-idea-sprint':
      return bap578IdeaSprint(input);

    case 'four-meme-ai':
      return fourMemeIntegrationGuide(input);

    case 'bsc-nft-ops-guide':
      return bscNftOpsGuide(input);

    case 'bitagent-bonding-playbook':
      return bitagentBondingPlaybook(input);

    case 'multichain-portfolio-tracker':
      return multichainPortfolioTrackerGuide(input);

    case 'pancakeswap-trading-guard':
      return pancakeSwapTradingGuardGuide(input);

    case 'erc8004-agent-registry':
      return erc8004AgentRegistryGuide(input);

    case 'prediction-market-clob':
      return predictionMarketClobGuide(input);

    default: {
      const known = Array.from(loadSkillIds()).join(', ');
      throw new Error(`Unknown skillId: ${skillId}. Known: ${known}`);
    }
  }
}

export async function runPlaygroundLocal(payload: PlaygroundRequest): Promise<PlaygroundResponse> {
  const startedAt = Date.now();
  try {
    const result = await runLocalSkill(payload.skillId, payload.input || {});
    return {
      success: true,
      mode: 'local',
      data: result,
      executionTime: Date.now() - startedAt
    };
  } catch (error) {
    return {
      success: false,
      mode: 'local',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startedAt
    };
  }
}

export async function runPlaygroundRemote(
  payload: PlaygroundRequest,
  remote: { apiBase: string; apiPath: string; apiKey?: string; model?: string }
): Promise<PlaygroundResponse> {
  const startedAt = Date.now();

  const endpoint = `${remote.apiBase.replace(/\/$/, '')}${
    remote.apiPath.startsWith('/') ? remote.apiPath : `/${remote.apiPath}`
  }`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  if (remote.apiKey) {
    headers.Authorization = `Bearer ${remote.apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      skillId: payload.skillId,
      input: payload.input || {},
      model: remote.model,
      client: 'skillshub-web'
    })
  });

  const text = await response.text();
  let parsed: any;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    return {
      success: false,
      mode: 'proxy',
      error: parsed?.error || `Remote API failed with status ${response.status}`,
      executionTime: Date.now() - startedAt
    };
  }

  return {
    success: true,
    mode: 'proxy',
    data: parsed,
    executionTime: Date.now() - startedAt
  };
}
