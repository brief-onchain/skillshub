import fs from 'node:fs';

const FLAP_ENV_DEFAULT = '/Users/klxhans/Downloads/flap-nfa-mint/.env';

let loaded = false;
let loadedPath = '';
let loadError = '';

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  const idx = trimmed.indexOf('=');
  if (idx <= 0) {
    return null;
  }

  const key = trimmed.slice(0, idx).trim();
  let value = trimmed.slice(idx + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

export function ensureFlapEnvLoaded() {
  if (loaded || loadError) {
    return;
  }

  const envPath = process.env.FLAP_ENV_FILE || FLAP_ENV_DEFAULT;
  loadedPath = envPath;

  try {
    if (!fs.existsSync(envPath)) {
      loadError = 'env file missing';
      return;
    }

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        continue;
      }
      const [key, value] = parsed;
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
    loaded = true;
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'unknown load error';
  }
}

export function getEnvLoadStatus() {
  return {
    loaded,
    path: loadedPath || process.env.FLAP_ENV_FILE || FLAP_ENV_DEFAULT,
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
