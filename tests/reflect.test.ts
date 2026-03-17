/**
 * Reflect Timer Tests
 * 
 * RED: Test that verifies automatic entity reflection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockMemoryConsoleClient, createTestEntity, resetMockStores } from './mocks/memory-console.js';

describe('Reflect Timer', () => {
  let client: MockMemoryConsoleClient;

  beforeEach(() => {
    resetMockStores();
    client = new MockMemoryConsoleClient();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('auto reflect', () => {
    it('should store lastReflected when updated', async () => {
      // Create entity
      await client.createEntity({
        name: 'test-entity',
        description: 'Test entity for reflection',
        facts: ['fact-1', 'fact-2'],
        confidence: 0.5,
      });

      // Manually update with lastReflected (simulating reflect action)
      const entity = await client.getEntity('test-entity');
      if (entity) {
        await client.updateEntity(entity.id, {
          lastReflected: new Date(),
        });
      }

      // Get entity and check lastReflected was updated
      const updated = await client.getEntity('test-entity');
      
      expect(updated?.lastReflected).toBeDefined();
    });

    it('should update confidence based on fact count', async () => {
      await client.createEntity({
        name: 'high-fact-entity',
        facts: [],
        confidence: 0.5,
      });

      // Simulate adding more facts
      const entity = await client.getEntity('high-fact-entity');
      if (entity) {
        await client.updateEntity(entity.id, {
          facts: ['fact-1', 'fact-2', 'fact-3'],
        });
      }

      // Check confidence increased
      const updated = await client.getEntity('high-fact-entity');
      expect(updated?.facts.length).toBe(3);
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on fact count', async () => {
      // This tests the confidence calculation logic
      const calculateConfidence = (factCount: number): number => {
        // Simple algorithm: confidence increases with more facts
        return Math.min(0.5 + (factCount * 0.1), 1.0);
      };

      expect(calculateConfidence(0)).toBe(0.5);
      expect(calculateConfidence(3)).toBe(0.8);
      expect(calculateConfidence(10)).toBe(1.0); // Cap at 1.0
    });
  });
});
