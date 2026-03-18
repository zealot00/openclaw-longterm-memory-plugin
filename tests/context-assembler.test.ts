/**
 * Context Assembler Tests
 * 
 * RED: Test that verifies context assembly with memory retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextAssembler } from '../src/context-assembler.js';

const createMockStore = () => ({
  searchFacts: vi.fn().mockResolvedValue([
    { id: 'fact-1', content: 'User prefers dark mode', entities: ['preferences'], confidence: 0.9, factType: 'preference', createdAt: new Date() },
    { id: 'fact-2', content: 'User works on Docker project', entities: ['docker'], confidence: 0.8, factType: 'observation', createdAt: new Date() },
  ]),
});

describe('ContextAssembler', () => {
  let assembler: ContextAssembler;
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    mockStore = createMockStore();
    assembler = new ContextAssembler(mockStore as any, { maxFacts: 5 });
  });

  describe('assemble', () => {
    it('should return original messages', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const result = await assembler.assemble(messages, 'test-session');

      expect(result.messages).toEqual(messages);
    });

    it('should retrieve facts based on session topic', async () => {
      const messages = [
        { role: 'user', content: 'How do I configure Docker?' },
      ];

      await assembler.assemble(messages, 'test-session');

      expect(mockStore.searchFacts).toHaveBeenCalled();
    });

    it('should inject facts into systemPromptAddition', async () => {
      const messages = [
        { role: 'user', content: 'Configure Docker' },
      ];

      const result = await assembler.assemble(messages, 'test-session');

      expect(result.systemPromptAddition).toContain('relevant-facts');
      expect(result.systemPromptAddition).toContain('User prefers dark mode');
    });

    it('should estimate tokens', async () => {
      const messages = [
        { role: 'user', content: 'A'.repeat(100) },
        { role: 'assistant', content: 'B'.repeat(100) },
      ];

      const result = await assembler.assemble(messages, 'test-session');

      expect(result.estimatedTokens).toBeGreaterThan(0);
    });

    it('should handle empty messages', async () => {
      const result = await assembler.assemble([], 'test-session');

      expect(result.messages).toEqual([]);
      // Empty messages should still return long-term memory facts
      expect(result.systemPromptAddition).toContain('relevant-facts');
    });

    it('should handle store errors gracefully', async () => {
      mockStore.searchFacts = vi.fn().mockRejectedValue(new Error('Store error'));

      const messages = [{ role: 'user', content: 'Test' }];
      const result = await assembler.assemble(messages, 'test-session');

      // Should still return valid result
      expect(result.messages).toEqual(messages);
      expect(result.systemPromptAddition).toBe('');
    });
  });
});
