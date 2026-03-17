/**
 * Context Engine Type Definitions
 * Based on OpenClaw plugin-sdk/context-engine/types.d.ts
 */

export interface AssembleResult {
  /** Ordered messages to use as model context */
  messages: unknown[];
  /** Estimated total tokens in assembled context */
  estimatedTokens: number;
  /** Optional context-engine-provided instructions prepended to the runtime system prompt */
  systemPromptAddition?: string;
}

export interface CompactResult {
  ok: boolean;
  compacted: boolean;
  reason?: string;
  result?: {
    summary?: string;
    firstKeptEntryId?: string;
    tokensBefore: number;
    tokensAfter?: number;
    details?: unknown;
  };
}

export interface IngestResult {
  /** Whether the message was ingested (false if duplicate or no-op) */
  ingested: boolean;
}

export interface IngestBatchResult {
  /** Number of messages ingested from the supplied batch */
  ingestedCount: number;
}

export interface BootstrapResult {
  /** Whether bootstrap ran and initialized the engine's store */
  bootstrapped: boolean;
  /** Number of historical messages imported (if applicable) */
  importedMessages?: number;
  /** Optional reason when bootstrap was skipped */
  reason?: string;
}

export interface ContextEngineInfo {
  id: string;
  name: string;
  version?: string;
  /** True when the engine manages its own compaction lifecycle. */
  ownsCompaction?: boolean;
}

export interface SubagentSpawnPreparation {
  /** Roll back pre-spawn setup when subagent launch fails. */
  rollback: () => void | Promise<void>;
}

export type SubagentEndReason = "deleted" | "completed" | "swept" | "released";

export interface ContextEngineRuntimeContext {
  [key: string]: unknown;
}

/**
 * Full ContextEngine interface matching OpenClaw plugin-sdk
 */
export interface ContextEngine {
  /** Engine identifier and metadata */
  readonly info: ContextEngineInfo;

  /**
   * Initialize engine state for a session, optionally importing historical context.
   */
  bootstrap?(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
  }): Promise<BootstrapResult>;

  /**
   * Ingest a single message into the engine's store.
   */
  ingest(params: {
    sessionId: string;
    sessionKey?: string;
    message: unknown;
    /** True when the message belongs to a heartbeat run. */
    isHeartbeat?: boolean;
  }): Promise<IngestResult>;

  /**
   * Ingest a completed turn batch as a single unit.
   */
  ingestBatch?(params: {
    sessionId: string;
    sessionKey?: string;
    messages: unknown[];
    /** True when the batch belongs to a heartbeat run. */
    isHeartbeat?: boolean;
  }): Promise<IngestBatchResult>;

  /**
   * Execute optional post-turn lifecycle work after a run attempt completes.
   */
  afterTurn?(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    messages: unknown[];
    /** Number of messages that existed before the prompt was sent. */
    prePromptMessageCount: number;
    /** Optional auto-compaction summary emitted by the runtime. */
    autoCompactionSummary?: string;
    /** True when this turn belongs to a heartbeat run. */
    isHeartbeat?: boolean;
    /** Optional model context token budget for proactive compaction. */
    tokenBudget?: number;
    /** Optional runtime-owned context for engines that need caller state. */
    runtimeContext?: ContextEngineRuntimeContext;
  }): Promise<void>;

  /**
   * Assemble model context under a token budget.
   */
  assemble(params: {
    sessionId: string;
    sessionKey?: string;
    messages: unknown[];
    tokenBudget?: number;
  }): Promise<AssembleResult>;

  /**
   * Compact context to reduce token usage.
   */
  compact(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    tokenBudget?: number;
    force?: boolean;
    currentTokenCount?: number;
    compactionTarget?: "budget" | "threshold";
    customInstructions?: string;
    runtimeContext?: ContextEngineRuntimeContext;
  }): Promise<CompactResult>;

  /**
   * Prepare context-engine-managed subagent state before the child run starts.
   */
  prepareSubagentSpawn?(params: {
    parentSessionKey: string;
    childSessionKey: string;
    ttlMs?: number;
  }): Promise<SubagentSpawnPreparation | undefined>;

  /**
   * Notify the context engine that a subagent lifecycle ended.
   */
  onSubagentEnded?(params: {
    childSessionKey: string;
    reason: SubagentEndReason;
  }): Promise<void>;

  /**
   * Dispose of any resources held by the engine.
   */
  dispose?(): Promise<void>;
}
