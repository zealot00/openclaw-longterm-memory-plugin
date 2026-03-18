/**
 * Context Assembler
 * 
 * Assembles context with memory retrieval
 */

import { extractSessionTopic } from './topic-extractor.js';
import { NarrativeFactStore } from './fact-store.js';
import type { NarrativeFact } from './types/index.js';

export interface AssemblerOptions {
  maxFacts?: number;
}

export interface AssembleResult {
  messages: any[];
  estimatedTokens: number;
  systemPromptAddition: string;
}

/**
 * Token estimation (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class ContextAssembler {
  private store: NarrativeFactStore;
  private maxFacts: number;

  constructor(store: NarrativeFactStore, options: AssemblerOptions = {}) {
    this.store = store;
    this.maxFacts = options.maxFacts ?? 5;
  }

  /**
   * Assemble context with memory retrieval
   */
  async assemble(messages: any[], sessionId: string): Promise<AssembleResult> {
    // 1. Return original messages
    const originalMessages = messages;

    // 2. Estimate tokens
    let totalTokens = 0;
    for (const msg of messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      totalTokens += estimateTokens(content);
    }

    // 3. Extract topic and search memories
    let systemPromptAddition = '';
    
    // Always search for facts to provide long-term memory context
    try {
      const topic = messages.length > 0 ? extractSessionTopic(messages) : '';
      
      if (topic || messages.length === 0) {
        const facts = await this.store.searchFacts(topic, { limit: this.maxFacts });
        
        if (facts.length > 0) {
          const factLines = facts.map((f, i) => 
            `${i + 1}. [${f.factType}] ${f.content}`
          ).join('\n');
          
          systemPromptAddition = `<relevant-facts>
These facts from your long-term memory may be relevant:
${factLines}
</relevant-facts>`;
          
          // Add tokens for the added content
          totalTokens += estimateTokens(systemPromptAddition);
        }
      }
    } catch (error) {
      // Log error but don't fail the assembly
      console.warn('Failed to retrieve memories:', error);
    }

    return {
      messages: originalMessages,
      estimatedTokens: totalTokens,
      systemPromptAddition,
    };
  }
}
