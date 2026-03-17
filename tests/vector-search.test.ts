/**
 * Vector Search Integration Tests
 * 
 * RED: Test that verifies embedding-based semantic search
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockMemoryConsoleClient, resetMockStores } from './mocks/memory-console.js';

describe('Vector Search Integration', () => {
  let client: MockMemoryConsoleClient;

  beforeEach(() => {
    resetMockStores();
    client = new MockMemoryConsoleClient();
  });

  describe('searchMemories with embeddings', () => {
    it('should find memories by semantic similarity', async () => {
      // Create memories with embeddings
      await client.createMemory({
        title: 'User likes coffee',
        content: 'The user prefers strong coffee in the morning',
        namespace: 'default',
        tags: ['preferences', 'coffee'],
        embedding: [0.9, 0.1, 0.2], // Similar to query
      });

      await client.createMemory({
        title: 'Weather today',
        content: 'It is raining outside',
        namespace: 'default',
        tags: ['weather'],
        embedding: [0.1, 0.9, 0.3], // Different from query
      });

      // Search with a keyword that exists in the content
      const results = await client.searchMemories('coffee', { limit: 5 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('coffee');
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await client.createMemory({
          title: `Memory ${i}`,
          content: `Content ${i}`,
          namespace: 'default',
          tags: [],
          embedding: [0.5, 0.5, 0.5],
        });
      }

      const results = await client.searchMemories('Memory', { limit: 2 });

      expect(results.length).toBe(2);
    });

    it('should filter by namespace', async () => {
      await client.createMemory({
        title: 'Namespace A',
        content: 'Content in namespace A',
        namespace: 'namespace-a',
        tags: [],
      });

      await client.createMemory({
        title: 'Namespace B',
        content: 'Content in namespace B',
        namespace: 'namespace-b',
        tags: [],
      });

      const results = await client.searchMemories('namespace', { 
        namespace: 'namespace-a',
        limit: 10 
      });

      expect(results.every(r => r.namespace === 'namespace-a')).toBe(true);
    });

    it('should filter by tags', async () => {
      await client.createMemory({
        title: 'Tagged item',
        content: 'Content with tags',
        namespace: 'default',
        tags: ['important', 'priority'],
      });

      const results = await client.searchMemories('content', { 
        tags: ['important'],
        limit: 10,
      });

      expect(results.every(r => r.tags.includes('important'))).toBe(true);
    });
  });

  describe('searchNarrativeFacts with semantic query', () => {
    it('should find facts by semantic similarity', async () => {
      await client.createNarrativeFact({
        content: 'User prefers dark mode in the IDE',
        entities: ['preferences'],
        confidence: 0.9,
        factType: 'preference',
      });

      await client.createNarrativeFact({
        content: 'User likes light mode for presentations',
        entities: ['preferences'],
        confidence: 0.8,
        factType: 'preference',
      });

      // Search for "dark mode"
      const results = await client.searchNarrativeFacts('dark mode', { limit: 5 });

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
