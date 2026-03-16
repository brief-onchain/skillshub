import {
  CatalogPayload,
  Skill,
  PlaygroundRequest,
  PlaygroundResponse,
  HealthResponse,
  NfaChatRequest,
  NfaChatResponse,
  NfaAgentProfile
} from './types';

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_DEFAULT_API_BASE || '';

export class ApiClient {
  private static async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${DEFAULT_API_BASE}${endpoint}`;
    
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error(`Fetch error for ${endpoint}:`, error);
      throw error;
    }
  }

  static async checkHealth(): Promise<HealthResponse> {
    try {
      return await this.fetch<HealthResponse>('/api/health');
    } catch {
      return { status: 'ok', version: '0.1.0-mock' };
    }
  }

  static async getCatalog(): Promise<CatalogPayload> {
    try {
      return await this.fetch<CatalogPayload>('/api/skills');
    } catch {
      return {
        generatedAt: new Date().toISOString(),
        excludedDirections: [],
        openSourceCandidates: [],
        skills: [
          {
            id: 'price-snapshot',
            name: 'Price Snapshot',
            description: 'Get current price for a symbol',
            category: 'Market Data',
            version: '1.0.0'
          }
        ]
      };
    }
  }

  static async getSkills(): Promise<Skill[]> {
    const catalog = await this.getCatalog();
    return catalog.skills || [];
  }

  static async runPlayground(data: PlaygroundRequest): Promise<PlaygroundResponse> {
    try {
      return await this.fetch<PlaygroundResponse>('/api/playground', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        success: false,
        mode: 'local',
        error: 'Playground API unavailable'
      };
    }
  }

  static async runNfaChat(data: NfaChatRequest): Promise<NfaChatResponse> {
    try {
      return await this.fetch<NfaChatResponse>('/api/nfa/chat', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return {
        success: false,
        error: 'NFA chat API unavailable'
      };
    }
  }

  static async getNfaAgent(tokenId: number): Promise<NfaAgentProfile> {
    return await this.fetch<NfaAgentProfile>(`/api/nfa/agent/${tokenId}`);
  }
}
