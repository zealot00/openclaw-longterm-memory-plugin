/**
 * Narrative Fact CRUD Tests
 * 
 * RED: Test that verifies narrative fact creation and retrieval
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockMemoryConsoleClient, createTestFact, resetMockStores } from './mocks/memory-console.js';

describe('NarrativeFact CRUD', () => {
  let client: MockMemoryConsoleClient;

  beforeEach(() => {
    resetMockStores();
    client = new MockMemoryConsoleClient();
  });

  describe('createNarrativeFact', () => {
    it('should create a new narrative fact', async () => {
      const fact = await client.createNarrativeFact({
        content: 'User prefers dark mode',
        entities: ['user-preferences'],
        confidence: 0.9,
        factType: 'preference',
        sessionId: 'test-session',
      });

      expect(fact.id).toBeDefined();
      expect(fact.content).toBe('User prefers dark mode');
      expect(fact.entities).toContain('user-preferences');
      expect(fact.confidence).toBe(0.9);
      expect(fact.factType).toBe('preference');
    });

    it('should auto-generate unique IDs', async () => {
      const fact1 = await client.createNarrativeFact({
        content: 'Fact 1',
        entities: ['entity1'],
        confidence: 0.8,
        factType: 'observation',
      });

      const fact2 = await client.createNarrativeFact({
        content: 'Fact 2',
        entities: ['entity2'],
        confidence: 0.8,
        factType: 'observation',
      });

      expect(fact1.id).not.toBe(fact2.id);
    });
  });

  describe('searchNarrativeFacts', () => {
    it('should find facts by keyword', async () => {
      await client.createNarrativeFact({
        content: 'User prefers dark mode',
        entities: ['preferences'],
        confidence: 0.9,
        factType: 'preference',
      });

      await client.createNarrativeFact({
        content: 'User likes coffee',
        entities: ['preferences'],
        confidence: 0.8,
        factType: 'preference',
      });

      const results = await client.searchNarrativeFacts('dark mode');

      expect(results.length).toBe(1);
      expect(results[0].content).toContain('dark mode');
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await client.createNarrativeFact({
          content: `Fact ${i}`,
          entities: ['test'],
          confidence: 0.8,
          factType: 'observation',
        });
      }

      const results = await client.searchNarrativeFacts('Fact', { limit: 3 });

      expect(results.length).toBe(3);
    });

    it('should return empty array when no match', async () => {
      const results = await client.searchNarrativeFacts('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('Entity association', () => {
    it('should associate fact with entity', async () => {
      await client.createNarrativeFact({
        content: 'Test fact',
        entities: ['test-entity'],
        confidence: 0.8,
        factType: 'observation',
      });

      const entity = await client.getEntity('test-entity');

      expect(entity).not.toBeNull();
      expect(entity?.name).toBe('test-entity');
      expect(entity?.facts.length).toBeGreaterThan(0);
    });

    it('should list all entities', async () => {
      await client.createNarrativeFact({
        content: 'Fact 1',
        entities: ['entity-a'],
        confidence: 0.8,
        factType: 'observation',
      });

      await client.createNarrativeFact({
        content: 'Fact 2',
        entities: ['entity-b'],
        confidence: 0.8,
        factType: 'observation',
      });

      const entities = await client.listEntities();

      expect(entities.length).toBe(2);
    });
  });
});
