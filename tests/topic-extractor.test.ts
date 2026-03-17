/**
 * Topic Extractor Tests
 * 
 * RED: Test that verifies session topic extraction from messages
 */

import { describe, it, expect } from 'vitest';
import { extractSessionTopic } from '../src/topic-extractor.js';

describe('Topic Extractor', () => {
  describe('extractSessionTopic', () => {
    it('should extract topic from recent user messages', () => {
      const messages = [
        { role: 'user', content: 'Help me with Docker deployment' },
        { role: 'assistant', content: 'Sure, I can help with Docker' },
        { role: 'user', content: 'How do I configure Traefik?' },
      ];
      
      const topic = extractSessionTopic(messages);
      expect(topic).toBeDefined();
      expect(topic.toLowerCase()).toContain('docker');
    });

    it('should return empty for empty messages', () => {
      const topic = extractSessionTopic([]);
      expect(topic).toBe('');
    });

    it('should prioritize recent messages', () => {
      const messages = [
        { role: 'user', content: 'Old topic about something' },
        { role: 'user', content: 'New topic about memory' },
      ];
      
      const topic = extractSessionTopic(messages);
      expect(topic.toLowerCase()).toContain('memory');
    });

    it('should extract keywords from content', () => {
      const messages = [
        { role: 'user', content: 'Configure the OpenClaw memory plugin with PostgreSQL' },
      ];
      
      const topic = extractSessionTopic(messages);
      const keywords = ['openclaw', 'memory', 'plugin', 'postgresql'];
      const hasKeyword = keywords.some(k => topic.toLowerCase().includes(k));
      expect(hasKeyword).toBe(true);
    });

    it('should limit keyword count', () => {
      const messages = [
        { role: 'user', content: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z' },
      ];
      
      const topic = extractSessionTopic(messages);
      const words = topic.split(',').filter(Boolean);
      expect(words.length).toBeLessThanOrEqual(10);
    });
  });
});
