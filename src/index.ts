/**
 * OpenClaw Long-term Memory Plugin
 * 
 * Context Engine plugin that enhances context assembly with
 * narrative fact retention and entity tracking.
 */

import type { ContextEngine } from './types/context-engine.js';
import { LongtermMemoryEngine } from './engine.js';

export { LongtermMemoryEngine };
export type { ContextEngineConfig, NarrativeFact, Entity } from './types/index.js';

/**
 * Plugin entry point - registers the context engine
 */
export function register(context: {
  registerContextEngine: (engine: ContextEngine) => void;
  pluginConfig: Record<string, unknown>;
}) {
  const config = context.pluginConfig as ContextEngineConfig;
  const engine = new LongtermMemoryEngine(config);
  context.registerContextEngine(engine);
}

export default { register };
