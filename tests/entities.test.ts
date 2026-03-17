/**
 * Entity CRUD Tests
 * 
 * RED: Test that verifies entity creation and management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockMemoryConsoleClient, createTestEntity, resetMockStores } from './mocks/memory-console.js';

describe('Entity CRUD', () => {
  let client: MockMemoryConsoleClient;

  beforeEach(() => {
    resetMockStores();
    client = new MockMemoryConsoleClient();
  });

  describe('createEntity', () => {
    it('should create a new entity', async () => {
      const entity = await client.createEntity({
        name: 'user-preferences',
        description: 'User preference settings',
        facts: [],
        confidence: 0.8,
      });

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('user-preferences');
      expect(entity.description).toBe('User preference settings');
      expect(entity.confidence).toBe(0.8);
      expect(entity.facts).toEqual([]);
    });

    it('should auto-generate timestamps', async () => {
      const entity = await client.createEntity({
        name: 'test-entity',
        facts: [],
        confidence: 0.5,
      });

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getEntity', () => {
    it('should retrieve entity by name', async () => {
      await client.createEntity({
        name: 'target-entity',
        description: 'Test entity',
        facts: [],
        confidence: 0.9,
      });

      const entity = await client.getEntity('target-entity');

      expect(entity).not.toBeNull();
      expect(entity?.name).toBe('target-entity');
      expect(entity?.description).toBe('Test entity');
    });

    it('should return null for nonexistent entity', async () => {
      const entity = await client.getEntity('nonexistent');

      expect(entity).toBeNull();
    });
  });

  describe('updateEntity', () => {
    it('should update entity fields', async () => {
      const created = await client.createEntity({
        name: 'updatable-entity',
        description: 'Original description',
        facts: [],
        confidence: 0.5,
      });

      const updated = await client.updateEntity(created.id, {
        description: 'Updated description',
        confidence: 0.9,
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.confidence).toBe(0.9);
      expect(updated.name).toBe('updatable-entity'); // Unchanged
    });

    it('should update facts array', async () => {
      const created = await client.createEntity({
        name: 'entity-with-facts',
        facts: [],
        confidence: 0.5,
      });

      const updated = await client.updateEntity(created.id, {
        facts: ['fact-1', 'fact-2'],
      });

      expect(updated.facts).toContain('fact-1');
      expect(updated.facts).toContain('fact-2');
    });

    it('should update lastReflected timestamp', async () => {
      const created = await client.createEntity({
        name: 'reflected-entity',
        facts: [],
        confidence: 0.5,
      });

      const now = new Date();
      const updated = await client.updateEntity(created.id, {
        lastReflected: now,
      });

      expect(updated.lastReflected?.getTime()).toBe(now.getTime());
    });

    it('should throw error for nonexistent entity', async () => {
      await expect(
        updateEntity('nonexistent-id', { confidence: 0.9 })
      ).rejects.toThrow('Entity not found');
    });
  });

  describe('listEntities', () => {
    it('should list all entities', async () => {
      await client.createEntity({ name: 'entity-a', facts: [], confidence: 0.8 });
      await client.createEntity({ name: 'entity-b', facts: [], confidence: 0.7 });
      await client.createEntity({ name: 'entity-c', facts: [], confidence: 0.6 });

      const entities = await client.listEntities();

      expect(entities.length).toBe(3);
    });

    it('should return empty array when no entities', async () => {
      const entities = await client.listEntities();

      expect(entities).toEqual([]);
    });
  });
});

// Helper function for test
async function updateEntity(id: string, updates: any) {
  const client = new MockMemoryConsoleClient();
  return client.updateEntity(id, updates);
}
