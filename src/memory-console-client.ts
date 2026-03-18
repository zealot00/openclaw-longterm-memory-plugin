/**
 * Memory Console HTTP Client
 * 
 * Real implementation that connects to memory-console REST API
 */

import type { 
  NarrativeFact, 
  Entity, 
  MemoryEntry, 
  MemoryConsoleClient,
  SearchOptions 
} from './types/index.js';

export class MemoryConsoleHttpClient implements MemoryConsoleClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Memory Console API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as T;
    return data;
  }

  async createMemory(memory: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry> {
    return this.request<MemoryEntry>('POST', '/api/memories', memory);
  }

  async searchMemories(query: string, options?: SearchOptions): Promise<MemoryEntry[]> {
    const params = new URLSearchParams({
      q: query,
      ...(options?.limit ? { limit: String(options.limit) } : {}),
      ...(options?.namespace ? { namespace: options.namespace } : {}),
    });

    return this.request<MemoryEntry[]>('GET', `/api/memories/search?${params}`);
  }

  async createNarrativeFact(fact: Omit<NarrativeFact, 'id'>): Promise<NarrativeFact> {
    return this.request<NarrativeFact>('POST', '/api/narrative-facts', fact);
  }

  async searchNarrativeFacts(query: string, options?: SearchOptions): Promise<NarrativeFact[]> {
    const params = new URLSearchParams({
      q: query,
      ...(options?.limit ? { limit: String(options.limit) } : {}),
    });

    return this.request<NarrativeFact[]>('GET', `/api/narrative-facts/search?${params}`);
  }

  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity> {
    return this.request<Entity>('POST', '/api/entities', entity);
  }

  async getEntity(name: string): Promise<Entity | null> {
    try {
      return await this.request<Entity>('GET', `/api/entities/${encodeURIComponent(name)}`);
    } catch (error) {
      // Entity not found
      return null;
    }
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    return this.request<Entity>('PATCH', `/api/entities/${id}`, updates);
  }

  async listEntities(): Promise<Entity[]> {
    return this.request<Entity[]>('GET', '/api/entities');
  }
}

/**
 * Factory function to create the appropriate client
 */
export function createMemoryConsoleClient(
  baseUrl: string,
  token: string,
  useMock: boolean = false
): MemoryConsoleClient {
  if (useMock) {
    throw new Error('Mock client must be imported and instantiated directly');
  }
  return new MemoryConsoleHttpClient(baseUrl, token);
}
