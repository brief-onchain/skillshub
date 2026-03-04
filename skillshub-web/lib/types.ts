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
