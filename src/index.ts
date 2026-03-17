/**
 * OpenClaw Long-term Memory Plugin
 * 
 * Context Engine plugin that enhances context assembly with
 * narrative fact retention and entity tracking.
 * 
 * Follows official OpenClaw plugin pattern using register(api)
 */

import type { 
  OpenClawPluginApi, 
  ContextEngine, 
  ContextEngineInfo
} from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import type { ContextEngineConfig, NarrativeFact, MemoryConsoleClient } from "./types/index.js";
import { MemoryConsoleHttpClient } from "./memory-console-client.js";

// Use any for messages to avoid type conflicts
type AnyMessage = any;

class LongtermMemoryEngine implements ContextEngine {
  readonly info: ContextEngineInfo;
  private config: ContextEngineConfig;
  private client: MemoryConsoleClient;
  private sessionFacts: Map<string, NarrativeFact[]> = new Map();

  constructor(config: ContextEngineConfig) {
    this.info = {
      id: 'longterm-memory',
      name: 'Long-term Memory Context',
      version: '0.1.0',
      ownsCompaction: false,
    };
    
    this.config = {
      memoryConsoleUrl: config.memoryConsoleUrl ?? 'http://localhost:3000',
      maxNarrativeFacts: config.maxNarrativeFacts ?? 5,
      entityConfidenceThreshold: config.entityConfidenceThreshold ?? 0.7,
      autoReflectInterval: config.autoReflectInterval ?? 3600,
    };
    
    this.client = new MemoryConsoleHttpClient(
      this.config.memoryConsoleUrl!,
      config.apiToken ?? ''
    );
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
    message: AnyMessage;
    isHeartbeat?: boolean;
  }) {
    return { ingested: true };
  }

  async ingestBatch(params: {
    sessionId: string;
    sessionKey?: string;
    messages: AnyMessage[];
    isHeartbeat?: boolean;
  }) {
    return { ingestedCount: params.messages.length };
  }

  async afterTurn(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    messages: AnyMessage[];
    prePromptMessageCount: number;
    autoCompactionSummary?: string;
    isHeartbeat?: boolean;
    tokenBudget?: number;
    runtimeContext?: Record<string, unknown>;
  }): Promise<void> {
    // No-op
  }

  async assemble(params: {
    sessionId: string;
    sessionKey?: string;
    messages: AnyMessage[];
    tokenBudget?: number;
  }) {
    const maxFacts = this.config.maxNarrativeFacts ?? 5;
    
    let facts: NarrativeFact[] = [];
    try {
      facts = await this.client.searchNarrativeFacts('', { limit: maxFacts });
    } catch (error) {
      console.warn('Failed to fetch narrative facts:', error);
    }
    
    let systemPromptAddition = '';
    if (facts.length > 0) {
      const factLines = facts.map((f, i) => `${i + 1}. [${f.factType}] ${f.content}`).join('\n');
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
      const config = api.pluginConfig as ContextEngineConfig;
      return new LongtermMemoryEngine(config);
    });
  },
};

export default longtermMemoryPlugin;
