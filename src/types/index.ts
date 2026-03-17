/**
 * Internal type definitions for the plugin
 */

export interface ContextEngineConfig {
  memoryConsoleUrl?: string;
  apiToken?: string;
  maxNarrativeFacts?: number;
  autoReflectInterval?: number;
  entityConfidenceThreshold?: number;
}

export type FactType = 'world' | 'experience' | 'opinion' | 'observation';

export interface NarrativeFact {
  id: string;
  content: string;
  entities: string[];
  confidence: number;
  factType: FactType;
  createdAt: Date;
  source?: string;
  sessionId?: string;
}

export interface Entity {
  id: string;
  name: string;
  description?: string;
  facts: string[];  // NarrativeFact IDs
  confidence: number;
  lastReflected?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryConsoleClient {
  // Memory operations
  createMemory(memory: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry>;
  searchMemories(query: string, options?: SearchOptions): Promise<MemoryEntry[]>;
  
  // Narrative fact operations
  createNarrativeFact(fact: Omit<NarrativeFact, 'id'>): Promise<NarrativeFact>;
  searchNarrativeFacts(query: string, options?: SearchOptions): Promise<NarrativeFact[]>;
  
  // Entity operations
  createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity>;
  getEntity(name: string): Promise<Entity | null>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
  listEntities(): Promise<Entity[]>;
}

export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  namespace: string;
  tags: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchOptions {
  limit?: number;
  namespace?: string;
  tags?: string[];
  minScore?: number;
}
