/**
 * Fallback Mechanism Tests
 * 
 * RED: Test that verifies graceful degradation when API fails
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LongtermMemoryEngine } from '../src/index.js';
import type { ContextEngineConfig } from '../src/types/index.js';
import type { MemoryConsoleClient } from '../src/types/index.js';
import type { NarrativeFact } from '../src/types/index.js';

// Mock client that always fails
class FailingMemoryConsoleClient implements MemoryConsoleClient {
  async createMemory() { throw new Error('API unavailable'); }
  async searchMemories() { throw new Error('API unavailable'); }
  async createNarrativeFact() { throw new Error('API unavailable'); }
  async searchNarrativeFacts() { throw new Error('API unavailable'); }
  async createEntity() { throw new Error('API unavailable'); }
  async getEntity() { throw new Error('API unavailable'); }
  async updateEntity() { throw new Error('API unavailable'); }
  async listEntities() { throw new Error('API unavailable'); }
}

describe('Fallback Mechanism', () => {
  let engine: LongtermMemoryEngine;
  let config: ContextEngineConfig;

  beforeEach(() => {
    config = {
      memoryConsoleUrl: 'http://localhost:3000',
      maxNarrativeFacts: 5,
      entityConfidenceThreshold: 0.7,
    };
  });

  describe('assemble with failing client', () => {
    it('should return valid result when API fails', async () => {
      const failingClient = new FailingMemoryConsoleClient();
      engine = LongtermMemoryEngine.withClient(config, failingClient);

      const result = await engine.assemble({
        sessionId: 'test-session',
        messages: [],
      });

      // Should still return valid result structure
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('estimatedTokens');
      expect(result).toHaveProperty('systemPromptAddition');
    });

    it('should not crash when API returns unexpected error', async () => {
      const failingClient = new FailingMemoryConsoleClient();
      engine = LongtermMemoryEngine.withClient(config, failingClient);

      // Should not throw
      await expect(
        engine.assemble({
          sessionId: 'test-session',
          messages: [],
        })
      ).resolves.not.toThrow();
    });

    it('should return empty systemPromptAddition on failure', async () => {
      const failingClient = new FailingMemoryConsoleClient();
      engine = LongtermMemoryEngine.withClient(config, failingClient);

      const result = await engine.assemble({
        sessionId: 'test-session',
        messages: [],
      });

      // Should have empty or undefined systemPromptAddition
      expect(result.systemPromptAddition).toBe('');
    });
  });

  describe('bootstrap with failing client', () => {
    it('should bootstrap successfully even with failing client', async () => {
      const failingClient = new FailingMemoryConsoleClient();
      engine = LongtermMemoryEngine.withClient(config, failingClient);

      const result = await engine.bootstrap({
        sessionId: 'test-session',
        sessionKey: 'test-key',
        sessionFile: '/tmp/test.json',
      });

      expect(result.bootstrapped).toBe(true);
    });
  });

  describe('compact with failing client', () => {
    it('should delegate to legacy even with failing client', async () => {
      const failingClient = new FailingMemoryConsoleClient();
      engine = LongtermMemoryEngine.withClient(config, failingClient);

      const result = await engine.compact({
        sessionId: 'test-session',
        sessionFile: '/tmp/test.json',
      });

      expect(result.ok).toBe(true);
      expect(result.compacted).toBe(false);
      expect(result.reason).toContain('legacy');
    });
  });
});
