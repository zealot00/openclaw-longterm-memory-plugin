/**
 * Message Parser Tests
 * 
 * RED: Test that verifies message content extraction
 */

import { describe, it, expect } from 'vitest';
import { extractMessageContent } from '../src/message-parser.js';

describe('Message Parser', () => {
  describe('extractMessageContent', () => {
    it('should extract content from user message', () => {
      const message = {
        role: 'user',
        content: 'Hello, how are you?'
      };
      
      const result = extractMessageContent(message);
      expect(result).toBe('Hello, how are you?');
    });

    it('should extract content from assistant message', () => {
      const message = {
        role: 'assistant',
        content: 'I am doing well!'
      };
      
      const result = extractMessageContent(message);
      expect(result).toBe('I am doing well!');
    });

    it('should handle array content (multi-part)', () => {
      const message = {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: 'World' }
        ]
      };
      
      const result = extractMessageContent(message);
      expect(result).toBe('Hello World');
    });

    it('should return empty string for unknown format', () => {
      const message = {
        role: 'user',
        unknown: 'field'
      };
      
      const result = extractMessageContent(message);
      expect(result).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(extractMessageContent(null)).toBe('');
      expect(extractMessageContent(undefined)).toBe('');
    });
  });
});
