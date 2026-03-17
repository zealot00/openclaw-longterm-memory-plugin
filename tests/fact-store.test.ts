/**
 * NarrativeFact Store Tests
 * 
 * RED: Test that verifies fact storage integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NarrativeFactStore } from '../src/fact-store.js';
import type { NarrativeFact } from '../src/types/index.js';

// Mock client
const createMockClient = () => ({
  createNarrativeFact: vi.fn().mockResolvedValue({ id: 'fact-123', content: 'test', entities: [], confidence: 0.8, factType: 'observation', createdAt: new Date() }),
  searchNarrativeFacts: vi.fn().mockResolvedValue([]),
});

describe('NarrativeFactStore', () => {
  let store: NarrativeFactStore;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    store = new NarrativeFactStore(mockClient as any);
  });

  describe('addFact', () => {
    it('should add a fact to the store', async () => {
      const fact = {
        content: 'User prefers dark mode',
        entities: ['preferences'],
        confidence: 0.9,
        factType: 'preference' as const,
        sessionId: 'test-session',
      };

      const result = await store.addFact(fact);

      expect(result).toBeDefined();
      expect(result.id).toBe('fact-123');
      expect(mockClient.createNarrativeFact).toHaveBeenCalledWith(fact);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.createNarrativeFact = vi.fn().mockRejectedValue(new Error('API error'));

      const fact = {
        content: 'Test fact',
        entities: ['test'],
        confidence: 0.8,
        factType: 'observation' as const,
        sessionId: 'test-session',
      };

      // Should not throw
      await expect(store.addFact(fact)).resolves.not.toThrow();
    });
  });

  describe('searchFacts', () => {
    it('should search facts with query', async () => {
      mockClient.searchNarrativeFacts = vi.fn().mockResolvedValue([
        { id: 'fact-1', content: 'Test result', entities: [], confidence: 0.8, factType: 'observation', createdAt: new Date() }
      ]);

      const results = await store.searchFacts('test query');

      expect(results.length).toBe(1);
      expect(mockClient.searchNarrativeFacts).toHaveBeenCalledWith('test query', { limit: 5 });
    });

    it('should respect limit parameter', async () => {
      mockClient.searchNarrativeFacts = vi.fn().mockResolvedValue([]);

      await store.searchFacts('query', { limit: 10 });

      expect(mockClient.searchNarrativeFacts).toHaveBeenCalledWith('query', { limit: 10 });
    });
  });
});
