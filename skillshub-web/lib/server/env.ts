let loaded = false;
let loadedPath = '';
let loadError = '';

export function ensureFlapEnvLoaded() {
  if (loaded || loadError) {
    return;
  }

  try {
    // Cloud/self-contained mode:
    // envs must come from this project's .env.local or the deployment platform.
    loaded = true;
    loadedPath = 'process.env / .env.local';
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'unknown load error';
  }
}

export function getEnvLoadStatus() {
  return {
    loaded,
    path: loadedPath || 'process.env / .env.local',
    error: loadError || null
  };
}

export function getApiConfig() {
  return {
    apiBase:
      process.env.SKILLS_API_BASE ||
      process.env.AI_API_BASE ||
      '',
    apiPath: process.env.SKILLS_API_PATH || '/skills/run',
    apiKey:
      process.env.SKILLS_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.GEMINI_API_KEY ||
      '',
    model:
      process.env.SKILLS_API_MODEL ||
      process.env.OPENAI_MODEL ||
      process.env.OPENROUTER_MODEL ||
      process.env.GEMINI_MODEL ||
      'gpt-4.1-mini'
  };
}

export function getLlmConfig() {
  const openrouterBase = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const openaiBase = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const genericKey = process.env.AI_API_KEY || '';

  // Provider-aware fallback:
  // 1) Prefer explicit OpenRouter config when OPENROUTER_API_KEY exists.
  // 2) Else prefer OpenAI config when OPENAI_API_KEY exists.
  // 3) Finally use generic AI_API_KEY with OPENAI_BASE_URL/OPENROUTER_BASE_URL/default base.
  if (openrouterKey) {
    return {
      apiBase: openrouterBase,
      apiKey: openrouterKey,
      model:
        process.env.OPENROUTER_MODEL ||
        process.env.OPENAI_MODEL ||
        process.env.SKILLS_API_MODEL ||
        'openai/gpt-4o-mini'
    };
  }

  if (openaiKey) {
    return {
      apiBase: openaiBase,
      apiKey: openaiKey,
      model:
        process.env.OPENAI_MODEL ||
        process.env.OPENROUTER_MODEL ||
        process.env.SKILLS_API_MODEL ||
        'gpt-4o-mini'
    };
  }

  return {
    apiBase:
      process.env.OPENAI_BASE_URL ||
      process.env.OPENROUTER_BASE_URL ||
      openrouterBase,
    apiKey: genericKey,
    model:
      process.env.OPENAI_MODEL ||
      process.env.OPENROUTER_MODEL ||
      process.env.SKILLS_API_MODEL ||
      'openai/gpt-4o-mini'
  };
}

export function getRpcEndpoints() {
  const candidates = [
    process.env.BSC_RPC_URL,
    process.env.BSC_RPC_URL_1,
    process.env.BSC_RPC_URL_2,
    process.env.BSC_RPC_URL_3,
    process.env.BSC_RPC_URL_4,
    process.env.BSC_MAINNET_RPC_URL,
    'https://bsc-dataseed.binance.org/'
  ];

  return Array.from(new Set(candidates.filter(Boolean))) as string[];
}
