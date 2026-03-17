/**
 * Narrative Fact Store
 * 
 * Manages narrative facts with memory-console integration
 */

import type { NarrativeFact, MemoryConsoleClient } from './types/index.js';

export interface FactStoreOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export class NarrativeFactStore {
  private client: MemoryConsoleClient;
  private maxRetries: number;
  private retryDelay: number;

  constructor(client: MemoryConsoleClient, options: FactStoreOptions = {}) {
    this.client = client;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
  }

  /**
   * Add a new fact to the store
   */
  async addFact(fact: Omit<NarrativeFact, 'id'>): Promise<NarrativeFact | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.client.createNarrativeFact(fact);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to add fact (attempt ${attempt}/${this.maxRetries}):`, error);
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    console.error('Failed to add fact after retries:', lastError);
    return null;
  }

  /**
   * Search facts by query
   */
  async searchFacts(query: string, options: { limit?: number; namespace?: string } = {}): Promise<NarrativeFact[]> {
    try {
      return await this.client.searchNarrativeFacts(query, {
        limit: options.limit ?? 5,
        namespace: options.namespace,
      });
    } catch (error) {
      console.error('Failed to search facts:', error);
      return [];
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
