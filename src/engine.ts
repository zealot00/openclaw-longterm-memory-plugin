/**
 * Long-term Memory Context Engine Implementation
 * 
 * This engine enhances context assembly by injecting relevant
 * narrative facts and entity information into the context window.
 * 
 * Compatible with OpenClaw plugin-sdk/context-engine interface
 */

import type { 
  ContextEngine, 
  ContextEngineInfo, 
  AssembleResult, 
  CompactResult,
  IngestResult,
  IngestBatchResult,
  BootstrapResult,
  SubagentSpawnPreparation,
  SubagentEndReason,
  ContextEngineRuntimeContext
} from './types/context-engine.js';
import type { ContextEngineConfig, NarrativeFact, MemoryConsoleClient } from './types/index.js';
import { MemoryConsoleHttpClient } from './memory-console-client.js';

export class LongtermMemoryEngine implements ContextEngine {
  readonly info: ContextEngineInfo;
  private config: ContextEngineConfig;
  private client: MemoryConsoleClient;
  private sessionFacts: Map<string, NarrativeFact[]> = new Map();

  /**
   * Create engine with custom client (for testing)
   */
  static withClient(config: ContextEngineConfig, client: MemoryConsoleClient): LongtermMemoryEngine {
    const engine = new LongtermMemoryEngine(config);
    engine.client = client;
    return engine;
  }

  constructor(config: ContextEngineConfig) {
    this.info = {
      id: 'longterm-memory',
      name: 'Long-term Memory Context',
      version: '0.1.0',
      ownsCompaction: false, // Delegate to legacy
    };
    
    this.config = {
      memoryConsoleUrl: config.memoryConsoleUrl ?? 'http://localhost:3000',
      maxNarrativeFacts: config.maxNarrativeFacts ?? 5,
      entityConfidenceThreshold: config.entityConfidenceThreshold ?? 0.7,
      autoReflectInterval: config.autoReflectInterval ?? 3600,
    };
    
    // Default: use HTTP client
    this.client = new MemoryConsoleHttpClient(
      this.config.memoryConsoleUrl!,
      config.apiToken ?? ''
    );
  }

  async bootstrap(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
  }): Promise<BootstrapResult> {
    this.sessionFacts.set(params.sessionId, []);
    
    return {
      bootstrapped: true,
      importedMessages: 0,
    };
  }

  async ingest(params: {
    sessionId: string;
    sessionKey?: string;
    message: unknown;
    isHeartbeat?: boolean;
  }): Promise<IngestResult> {
    // TODO: Analyze message for narrative facts and store to memory-console
    return { ingested: true };
  }

  async ingestBatch(params: {
    sessionId: string;
    sessionKey?: string;
    messages: unknown[];
    isHeartbeat?: boolean;
  }): Promise<IngestBatchResult> {
    // TODO: Batch analyze messages for narrative facts
    return { ingestedCount: params.messages.length };
  }

  async afterTurn(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    messages: unknown[];
    prePromptMessageCount: number;
    autoCompactionSummary?: string;
    isHeartbeat?: boolean;
    tokenBudget?: number;
    runtimeContext?: ContextEngineRuntimeContext;
  }): Promise<void> {
    // Optional: Trigger background reflect task here
    // For now, this is a no-op as we rely on assemble for retrieval
  }

  async assemble(params: {
    sessionId: string;
    sessionKey?: string;
    messages: unknown[];
    tokenBudget?: number;
  }): Promise<AssembleResult> {
    const maxFacts = this.config.maxNarrativeFacts ?? 5;
    
    // Query memory-console for relevant facts
    let facts: NarrativeFact[] = [];
    try {
      facts = await this.client.searchNarrativeFacts('', { limit: maxFacts });
    } catch (error) {
      console.warn('Failed to fetch narrative facts:', error);
    }
    
    // Build system prompt addition with facts
    let systemPromptAddition = '';
    if (facts.length > 0) {
      const factLines = facts.map((f, i) => 
        `${i + 1}. [${f.factType}] ${f.content}`
      ).join('\n');
      
      systemPromptAddition = `<relevant-facts>
These facts from your long-term memory may be relevant:
${factLines}
</relevant-facts>`;
    }

    return {
      messages: [],
      estimatedTokens: 0,
      systemPromptAddition,
    };
  }

  async compact(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    tokenBudget?: number;
    force?: boolean;
    currentTokenCount?: number;
    compactionTarget?: 'budget' | 'threshold';
    customInstructions?: string;
    runtimeContext?: ContextEngineRuntimeContext;
  }): Promise<CompactResult> {
    // Delegate to legacy compaction (ownsCompaction = false)
    return {
      ok: true,
      compacted: false,
      reason: 'Using legacy compaction',
    };
  }

  async prepareSubagentSpawn(params: {
    parentSessionKey: string;
    childSessionKey: string;
    ttlMs?: number;
  }): Promise<SubagentSpawnPreparation | undefined> {
    // Not implemented - subagent context isolation not needed
    return undefined;
  }

  async onSubagentEnded(params: {
    childSessionKey: string;
    reason: SubagentEndReason;
  }): Promise<void> {
    // Not implemented - cleanup if needed
  }

  async dispose(): Promise<void> {
    this.sessionFacts.clear();
  }
}
