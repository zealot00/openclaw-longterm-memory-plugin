/**
 * Fact Extractor
 * 
 * Extracts key facts from message content using simple pattern matching
 */

import type { NarrativeFact, FactType } from './types/index.js';

interface ExtractionPattern {
  pattern: RegExp;
  type: FactType;
  priority: number;
}

// Patterns for fact extraction
const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  // Preferences
  { pattern: /prefer|i like|i hate|i want|i need/i, type: 'preference', priority: 1 },
  { pattern: /always|never|usually/i, type: 'preference', priority: 2 },
  
  // Decisions
  { pattern: /decided|decided to|we will|i will|going to/i, type: 'decision', priority: 1 },
  { pattern: /chose|chosen|selected/i, type: 'decision', priority: 1 },
  
  // Opinions
  { pattern: /think|i believe|i feel|in my opinion/i, type: 'opinion', priority: 1 },
  { pattern: /better|worse|best|worst/i, type: 'opinion', priority: 2 },
  
  // Observations
  { pattern: /noticed|observed|saw|found that/i, type: 'observation', priority: 1 },
  { pattern: /seems|appears|looks like/i, type: 'observation', priority: 2 },
];

/**
 * Extract key facts from message content
 */
export function extractKeyFacts(content: string, sessionId: string): Omit<NarrativeFact, 'id'>[] {
  if (!content || content.length < 10) {
    return [];
  }

  const facts: Omit<NarrativeFact, 'id'>[] = [];
  
  // Try to match patterns
  for (const { pattern, type, priority } of EXTRACTION_PATTERNS) {
    if (pattern.test(content)) {
      const entities = extractEntities(content);
      
      facts.push({
        content: content.substring(0, 500), // Limit length
        entities,
        confidence: Math.min(0.5 + (priority * 0.2), 0.9),
        factType: type,
        createdAt: new Date(),
        sessionId,
      });
      
      break; // Only extract one fact per message for now
    }
  }

  // If no pattern matched, create a generic observation
  if (facts.length === 0 && content.length > 20) {
    facts.push({
      content: content.substring(0, 500),
      entities: extractEntities(content),
      confidence: 0.5,
      factType: 'observation',
      createdAt: new Date(),
      sessionId,
    });
  }

  return facts;
}

/**
 * Extract entities from content
 */
function extractEntities(content: string): string[] {
  const entities: Set<string> = new Set();
  
  // Simple entity extraction
  const words = content.split(/\s+/);
  for (const word of words) {
    // Capitalized words that aren't at sentence start
    if (/^[A-Z][a-z]{2,}/.test(word) && !/^(I|We|They|He|She|It|This|That|The)/.test(word)) {
      entities.add(word.replace(/[^a-zA-Z]/g, '').toLowerCase());
    }
  }

  // Known entity patterns
  const knownEntities = ['server', 'database', 'api', 'model', 'plugin', 'agent', 'memory', 'context', 'nuc', 'ollama'];
  for (const known of knownEntities) {
    if (content.toLowerCase().includes(known)) {
      entities.add(known);
    }
  }

  return Array.from(entities).slice(0, 5); // Limit to 5 entities
}
