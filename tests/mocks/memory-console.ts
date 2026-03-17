/**
 * Mock implementations for testing
 * 
 * These mocks simulate the memory-console API and storage
 * without requiring actual database connections.
 */

import type { 
  NarrativeFact, 
  Entity, 
  MemoryEntry, 
  MemoryConsoleClient,
  SearchOptions,
  FactType
} from '../types/index.js';

// In-memory store for tests
const factsStore = new Map<string, NarrativeFact>();
const entitiesStore = new Map<string, Entity>();
const memoryStore = new Map<string, MemoryEntry>();
let factIdCounter = 1;
let entityIdCounter = 1;

function generateFactId(): string {
  return `fact_${factIdCounter++}`;
}

function generateEntityId(): string {
  return `entity_${entityIdCounter++}`;
}

export class MockMemoryConsoleClient implements MemoryConsoleClient {
  async createMemory(memory: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      ...memory,
      id: `memory_${memoryStore.size + 1}`,
    };
    memoryStore.set(entry.id, entry);
    return entry;
  }

  async searchMemories(query: string, options?: SearchOptions): Promise<MemoryEntry[]> {
    const limit = options?.limit ?? 5;
    let results = Array.from(memoryStore.values());
    
    // Filter by query
    if (query) {
      results = results.filter(m => 
        m.content.toLowerCase().includes(query.toLowerCase()) ||
        m.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by namespace
    if (options?.namespace) {
      results = results.filter(m => m.namespace === options.namespace);
    }
    
    // Filter by tags
    if (options?.tags && options.tags.length > 0) {
      results = results.filter(m => 
        options.tags!.some(tag => m.tags.includes(tag))
      );
    }
    
    return results.slice(0, limit);
  }

  async createNarrativeFact(fact: Omit<NarrativeFact, 'id'>): Promise<NarrativeFact> {
    const newFact: NarrativeFact = {
      ...fact,
      id: generateFactId(),
    };
    factsStore.set(newFact.id, newFact);
    
    // Update related entities
    for (const entityName of fact.entities) {
      await this.addFactToEntity(entityName, newFact.id);
    }
    
    return newFact;
  }

  async searchNarrativeFacts(query: string, options?: SearchOptions): Promise<NarrativeFact[]> {
    const limit = options?.limit ?? 5;
    let results = Array.from(factsStore.values());
    
    // Filter by query (more comprehensive)
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(f => 
        f.content.toLowerCase().includes(queryLower) ||
        f.entities.some(e => e.toLowerCase().includes(queryLower))
      );
    }
    
    return results.slice(0, limit);
  }

  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity> {
    const now = new Date();
    const newEntity: Entity = {
      ...entity,
      id: generateEntityId(),
      createdAt: now,
      updatedAt: now,
    };
    entitiesStore.set(newEntity.name, newEntity);
    return newEntity;
  }

  async getEntity(name: string): Promise<Entity | null> {
    return entitiesStore.get(name) ?? null;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    const entity = Array.from(entitiesStore.values()).find(e => e.id === id);
    if (!entity) {
      throw new Error(`Entity not found: ${id}`);
    }
    
    const updated: Entity = {
      ...entity,
      ...updates,
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: new Date(),
    };
    
    entitiesStore.set(entity.name, updated);
    return updated;
  }

  async listEntities(): Promise<Entity[]> {
    return Array.from(entitiesStore.values());
  }

  private async addFactToEntity(entityName: string, factId: string): Promise<void> {
    let entity = entitiesStore.get(entityName);
    if (!entity) {
      entity = await this.createEntity({
        name: entityName,
        facts: [],
        confidence: 0.5,
      });
    }
    
    const updatedFacts = [...entity.facts, factId];
    await this.updateEntity(entity.id, { facts: updatedFacts });
  }
}

// Utility to create test facts
export function createTestFact(overrides: Partial<NarrativeFact> = {}): NarrativeFact {
  return {
    id: generateFactId(),
    content: overrides.content ?? 'Test fact content',
    entities: overrides.entities ?? ['test-entity'],
    confidence: overrides.confidence ?? 0.8,
    factType: overrides.factType ?? 'observation',
    createdAt: overrides.createdAt ?? new Date(),
    source: overrides.source,
    sessionId: overrides.sessionId,
  };
}

// Utility to create test entities
export function createTestEntity(overrides: Partial<Entity> = {}): Entity {
  const now = new Date();
  return {
    id: generateEntityId(),
    name: overrides.name ?? 'test-entity',
    description: overrides.description,
    facts: overrides.facts ?? [],
    confidence: overrides.confidence ?? 0.7,
    lastReflected: overrides.lastReflected,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

// Reset all stores (for test isolation)
export function resetMockStores(): void {
  factsStore.clear();
  entitiesStore.clear();
  memoryStore.clear();
  factIdCounter = 1;
  entityIdCounter = 1;
}
