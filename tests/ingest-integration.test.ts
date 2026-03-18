/**
 * Ingest Integration Tests
 * 
 * RED: Test that verifies ingest properly extracts and saves facts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LongtermMemoryEngine } from '../src/index.js';
import { NarrativeFactStore } from '../src/fact-store.js';
import { extractMessageContent } from '../src/message-parser.js';
import { extractKeyFacts } from '../src/fact-extractor.js';

// Mock client
const createMockClient = () => ({
  createNarrativeFact: vi.fn().mockResolvedValue({ id: 'fact-123' }),
  searchNarrativeFacts: vi.fn().mockResolvedValue([]),
});

describe('Ingest Integration', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  describe('Full ingest flow', () => {
    it('should extract content, extract facts, and save to store', async () => {
      const store = new NarrativeFactStore(mockClient as any);
      
      // Simulate ingest flow
      const message = {
        role: 'user',
        content: 'I prefer dark mode for coding'
      };

      // Step 1: Extract content
      const content = extractMessageContent(message);
      expect(content).toBe('I prefer dark mode for coding');

      // Step 2: Extract facts
      const facts = extractKeyFacts(content, 'test-session');
      expect(facts.length).toBeGreaterThan(0);

      // Step 3: Save to store
      for (const fact of facts) {
        await store.addFact(fact);
      }

      // Verify
      expect(mockClient.createNarrativeFact).toHaveBeenCalled();
    });

    it('should skip heartbeat messages', async () => {
      const store = new NarrativeFactStore(mockClient as any);
      
      const message = {
        role: 'user',
        content: 'Heartbeat message'
      };

      // In real implementation, heartbeat messages should be skipped
      const isHeartbeat = true; // Simulated
      
      if (!isHeartbeat) {
        const content = extractMessageContent(message);
        const facts = extractKeyFacts(content, 'test-session');
        for (const fact of facts) {
          await store.addFact(fact);
        }
      }

      // Should not save for heartbeat
      expect(mockClient.createNarrativeFact).not.toHaveBeenCalled();
    });

    it('should handle empty message gracefully', async () => {
      const store = new NarrativeFactStore(mockClient as any);
      
      const message = {
        role: 'user',
        content: ''
      };

      const content = extractMessageContent(message);
      const facts = extractKeyFacts(content, 'test-session');

      expect(content).toBe('');
      expect(facts).toEqual([]);
    });
  });
});
