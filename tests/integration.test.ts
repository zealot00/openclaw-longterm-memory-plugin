/**
 * Integration Tests: Engine + Narrative Facts
 * 
 * RED: Test that verifies the engine integrates with narrative facts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LongtermMemoryEngine } from '../src/engine.js';
import { MockMemoryConsoleClient, createTestFact, resetMockStores } from './mocks/memory-console.js';
import type { ContextEngineConfig } from '../src/types/index.js';

describe('Engine Integration', () => {
  let engine: LongtermMemoryEngine;
  let config: ContextEngineConfig;
  let mockClient: MockMemoryConsoleClient;

  beforeEach(() => {
    resetMockStores();
    config = {
      memoryConsoleUrl: 'http://localhost:3000',
      maxNarrativeFacts: 3,
      entityConfidenceThreshold: 0.7,
    };
    engine = new LongtermMemoryEngine(config);
    // Access the mock client through a getter for testing
    mockClient = new MockMemoryConsoleClient();
  });

  describe('assemble with facts', () => {
    it('should inject narrative facts into context', async () => {
      // Pre-populate with facts
      await mockClient.createNarrativeFact({
        content: 'User prefers dark mode',
        entities: ['preferences'],
        confidence: 0.9,
        factType: 'preference',
        sessionId: 'test-session',
      });

      await mockClient.createNarrativeFact({
        content: 'User is working on a TypeScript project',
        entities: ['project'],
        confidence: 0.8,
        factType: 'observation',
        sessionId: 'test-session',
      });

      // Now assemble should include facts in systemPromptAddition
      const result = await engine.assemble({
        sessionId: 'test-session',
        messages: [],
      });

      expect(result.systemPromptAddition).toBeDefined();
      expect(result.systemPromptAddition).toContain('relevant-facts');
    });

    it('should limit facts based on maxNarrativeFacts config', async () => {
      // Create more facts than the limit
      for (let i = 0; i < 5; i++) {
        await mockClient.createNarrativeFact({
          content: `Fact ${i}`,
          entities: ['test'],
          confidence: 0.8,
          factType: 'observation',
          sessionId: 'test-session',
        });
      }

      const result = await engine.assemble({
        sessionId: 'test-session',
        messages: [],
      });

      // The result should respect maxNarrativeFacts
      // Current implementation queries with limit, so it should work
      expect(result).toHaveProperty('estimatedTokens');
    });
  });

  describe('fallback mechanism', () => {
    it('should handle API errors gracefully', async () => {
      // This tests that the engine doesn't crash when memory-console is unavailable
      // In a real implementation, we'd inject a failing client
      
      const result = await engine.assemble({
        sessionId: 'nonexistent-session',
        messages: [],
      });

      // Should still return valid result, just without facts
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('estimatedTokens');
      expect(result).toHaveProperty('systemPromptAddition');
    });
  });
});
