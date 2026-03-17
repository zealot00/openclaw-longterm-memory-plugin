/**
 * Context Engine Tests
 * 
 * RED: Test that verifies the engine can be instantiated
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LongtermMemoryEngine } from '../src/engine.js';
import type { ContextEngineConfig } from '../src/types/index.js';

describe('LongtermMemoryEngine', () => {
  let engine: LongtermMemoryEngine;
  let config: ContextEngineConfig;

  beforeEach(() => {
    config = {
      memoryConsoleUrl: 'http://localhost:3000',
      maxNarrativeFacts: 5,
      entityConfidenceThreshold: 0.7,
    };
    engine = new LongtermMemoryEngine(config);
  });

  describe('info', () => {
    it('should have correct id', () => {
      expect(engine.info.id).toBe('longterm-memory');
    });

    it('should have correct name', () => {
      expect(engine.info.name).toBe('Long-term Memory Context');
    });

    it('should have version', () => {
      expect(engine.info.version).toBe('0.1.0');
    });
  });

  describe('bootstrap', () => {
    it('should initialize session', async () => {
      const result = await engine.bootstrap({
        sessionId: 'test-session',
        sessionKey: 'test-key',
        sessionFile: '/tmp/test.json',
      });

      expect(result.bootstrapped).toBe(true);
    });
  });

  describe('assemble', () => {
    it('should return AssembleResult with messages and estimatedTokens', async () => {
      const result = await engine.assemble({
        sessionId: 'test-session',
        messages: [],
      });

      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('estimatedTokens');
      expect(typeof result.estimatedTokens).toBe('number');
    });

    it('should include systemPromptAddition when facts exist', async () => {
      // Add some facts first via the mock
      const result = await engine.assemble({
        sessionId: 'test-session',
        messages: [],
      });

      // Result should have systemPromptAddition property
      expect(result).toHaveProperty('systemPromptAddition');
    });
  });

  describe('compact', () => {
    it('should return CompactResult', async () => {
      const result = await engine.compact({
        sessionId: 'test-session',
        sessionFile: '/tmp/test.json',
      });

      expect(result).toHaveProperty('ok');
      expect(result.compacted).toBe(false);
    });
  });

  describe('ingest', () => {
    it('should ingest messages', async () => {
      const result = await engine.ingest({
        sessionId: 'test-session',
        message: { role: 'user', content: 'Hello' },
      });

      expect(result.ingested).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose without errors', async () => {
      await expect(engine.dispose()).resolves.not.toThrow();
    });
  });
});
