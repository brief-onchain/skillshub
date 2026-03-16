export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author?: string;
  mode?: 'live' | 'guide' | 'integration';
  provenance?: 'original' | 'curated' | 'adapted';
  sourceAttribution?: string;
  sourceUrl?: string;
  sourceXHandle?: string;
  sourceXUrl?: string;
  sourceLicense?: string;
  maintainedBy?: string;
  inputExample?: Record<string, unknown>;
  installCommand?: string;
  libraryId?: string;
  libraryName?: string;
  repoPath?: string;
}

export interface PlaygroundRequest {
  skillId: string;
  input: Record<string, any>;
  apiBase?: string;
  apiPath?: string;
  apiKey?: string;
}

export interface PlaygroundResponse {
  success: boolean;
  mode?: 'local' | 'proxy';
  data?: any;
  error?: string;
  logs?: string[];
  executionTime?: number;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  envLoaded?: boolean;
  envPath?: string;
  apiConfigured?: boolean;
  timestamp?: string;
  warning?: string | null;
}

export interface NfaChatRequest {
  tokenId: number;
  walletAddress: string;
  signature: string;
  authMessage: string;
  message: string;
  skillId?: string;
  skillInput?: Record<string, any>;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface NfaChatResponse {
  success: boolean;
  reply?: string;
  model?: string;
  error?: string;
  skillResult?: PlaygroundResponse | null;
  toolResults?: Record<string, unknown>;
}

export interface NfaAgentProfile {
  tokenId: number;
  owner: string;
  identity: {
    roleId: number;
    traitSeed: string;
    mintedAt: string;
  };
  state: {
    active: boolean;
    logicAddress: string;
    createdAt: string;
  };
  persona: {
    role: string;
    style: string;
    expertise: string;
    traitSet: {
      tone: string;
      verbosity: string;
      catchphrase: string;
      emojiLevel: string;
    };
    systemPrompt: string;
  };
}

export interface ExcludedDirection {
  slug: string;
  note: string;
}

export interface OpenSourceCandidate {
  name: string;
  repo?: string;
  sourceTag: string;
  adaptation: string;
  localMirrorPath?: string;
  featuredModule?: boolean;
  researchNote?: string;
}

export interface CatalogPayload {
  generatedAt: string;
  libraries?: SkillLibrary[];
  skills: Skill[];
  excludedDirections: ExcludedDirection[];
  openSourceCandidates: OpenSourceCandidate[];
}

export interface SkillLibrary {
  libraryId: string;
  name: string;
  version: string;
  description?: string;
  localPath?: string;
}
