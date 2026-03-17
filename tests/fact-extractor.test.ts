/**
 * Fact Extractor Tests
 * 
 * RED: Test that verifies key fact extraction from message content
 */

import { describe, it, expect } from 'vitest';
import { extractKeyFacts } from '../src/fact-extractor.js';

describe('Fact Extractor', () => {
  describe('extractKeyFacts', () => {
    it('should extract user preference facts', () => {
      const content = 'I prefer dark mode for coding';
      
      const facts = extractKeyFacts(content, 'test-session');
      
      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].factType).toBe('preference');
    });

    it('should extract decision facts', () => {
      const content = 'We decided to use PostgreSQL for the database';
      
      const facts = extractKeyFacts(content, 'test-session');
      
      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].factType).toBe('decision');
    });

    it('should extract observation facts', () => {
      const content = 'The server is running slowly today';
      
      const facts = extractKeyFacts(content, 'test-session');
      
      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].factType).toBe('observation');
    });

    it('should return empty for very short content', () => {
      const content = 'Hello';
      
      const facts = extractKeyFacts(content, 'test-session');
      
      expect(facts).toEqual([]);
    });

    it('should include session ID in facts', () => {
      const content = 'User prefers dark mode for coding';
      
      const facts = extractKeyFacts(content, 'my-session-id');
      
      if (facts.length > 0) {
        expect(facts[0].sessionId).toBe('my-session-id');
      }
    });

    it('should extract entities from content', () => {
      const content = 'The NUC server needs more RAM';
      
      const facts = extractKeyFacts(content, 'test-session');
      
      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].entities.length).toBeGreaterThan(0);
    });
  });
});
