/**
 * OpenClaw Long-term Memory Plugin
 * 
 * Context Engine plugin that enhances context assembly with
 * narrative fact retention and entity tracking.
 * 
 * Follows official OpenClaw plugin pattern using register(api)
 */

import type { OpenClawPluginApi, ContextEngine, ContextEngineInfo } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import type { ContextEngineConfig, NarrativeFact, MemoryConsoleClient } from "./types/index.js";
import { MemoryConsoleHttpClient } from "./memory-console-client.js";
import { NarrativeFactStore } from "./fact-store.js";
import { ContextAssembler } from "./context-assembler.js";
import { extractMessageContent } from "./message-parser.js";
import { extractKeyFacts } from "./fact-extractor.js";

export class LongtermMemoryEngine implements ContextEngine {
  readonly info: ContextEngineInfo;
  private config: ContextEngineConfig;
  private client: MemoryConsoleClient;
  private factStore: NarrativeFactStore;
  private contextAssembler: ContextAssembler;
  private sessionFacts: Map<string, Omit<NarrativeFact, 'id'>[]> = new Map();

  /**
   * Create engine with custom client (for testing)
   */
  static withClient(config: ContextEngineConfig, client: MemoryConsoleClient): LongtermMemoryEngine {
    const engine = new LongtermMemoryEngine(config);
    engine.client = client;
    engine.factStore = new NarrativeFactStore(client);
    engine.contextAssembler = new ContextAssembler(engine.factStore, {
      maxFacts: config.maxNarrativeFacts ?? 5,
    });
    return engine;
  }

  constructor(config: ContextEngineConfig) {
    this.info = {
      id: 'longterm-memory',
      name: 'Long-term Memory Context',
      version: '0.1.0',
      ownsCompaction: false,
    };
    
    this.config = config;
    
    // Initialize HTTP client with environment variable support
    const defaultUrl = process.env.MEMORY_CONSOLE_URL ?? 'http://localhost:3000';
    const defaultToken = process.env.MEMORY_CONSOLE_API_TOKEN ?? '';
    
    this.client = new MemoryConsoleHttpClient(
      this.config.memoryConsoleUrl ?? defaultUrl,
      config.apiToken ?? defaultToken
    );
    
    // Initialize fact store and assembler
    this.factStore = new NarrativeFactStore(this.client);
    this.contextAssembler = new ContextAssembler(this.factStore, {
      maxFacts: this.config.maxNarrativeFacts ?? 5,
    });
  }

  async bootstrap(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
  }) {
    this.sessionFacts.set(params.sessionId, []);
    return { bootstrapped: true, importedMessages: 0 };
  }

  async ingest(params: {
    sessionId: string;
    sessionKey?: string;
    message: any;
    isHeartbeat?: boolean;
  }) {
    // Skip heartbeat messages
    if (params.isHeartbeat) {
      return { ingested: false };
    }

    try {
      // Extract content from message
      const content = extractMessageContent(params.message);
      
      if (!content || content.length < 10) {
        return { ingested: false };
      }

      // Extract key facts
      const facts = extractKeyFacts(content, params.sessionId);

      // Save facts to memory-console
      for (const fact of facts) {
        await this.factStore.addFact({
          content: fact.content,
          entities: fact.entities,
          confidence: fact.confidence,
          factType: fact.factType,
          createdAt: fact.createdAt,
          sessionId: fact.sessionId,
        });
      }

      // Store locally
      const existing = this.sessionFacts.get(params.sessionId) || [];
      this.sessionFacts.set(params.sessionId, [...existing, ...facts]);

      return { ingested: true };
    } catch (error) {
      console.warn('Failed to ingest message:', error);
      return { ingested: false };
    }
  }

  async ingestBatch(params: {
    sessionId: string;
    sessionKey?: string;
    messages: any[];
    isHeartbeat?: boolean;
  }) {
    let ingestedCount = 0;
    
    for (const message of params.messages) {
      const result = await this.ingest({
        ...params,
        message,
      });
      if (result.ingested) {
        ingestedCount++;
      }
    }

    return { ingestedCount };
  }

  async afterTurn(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    messages: any[];
    prePromptMessageCount: number;
    autoCompactionSummary?: string;
    isHeartbeat?: boolean;
    tokenBudget?: number;
    runtimeContext?: Record<string, unknown>;
  }): Promise<void> {
    // Could trigger background tasks here if needed
  }

  async assemble(params: {
    sessionId: string;
    sessionKey?: string;
    messages: any[];
    tokenBudget?: number;
  }) {
    // Use the context assembler
    return this.contextAssembler.assemble(params.messages, params.sessionId);
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
    runtimeContext?: Record<string, unknown>;
  }) {
    return { ok: true, compacted: false, reason: 'Using legacy compaction' };
  }

  async prepareSubagentSpawn(params: {
    parentSessionKey: string;
    childSessionKey: string;
    ttlMs?: number;
  }) {
    return undefined;
  }

  async onSubagentEnded(params: {
    childSessionKey: string;
    reason: 'deleted' | 'completed' | 'swept' | 'released';
  }): Promise<void> {
    // No-op
  }

  async dispose(): Promise<void> {
    this.sessionFacts.clear();
  }
}

const longtermMemoryPlugin = {
  id: "longterm-memory",
  name: "Long-term Memory Context",
  description: "Enhanced context engine with narrative fact retention and entity tracking",
  kind: "context-engine",
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    api.registerContextEngine("longterm-memory", () => {
      const config = (api.pluginConfig ?? {}) as ContextEngineConfig;
      return new LongtermMemoryEngine(config);
    });
  },
};

export default longtermMemoryPlugin;
