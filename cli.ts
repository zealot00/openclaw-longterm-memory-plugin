/**
 * CLI for openclaw-longterm-memory-plugin
 * 
 * Commands:
 *   status    - Health check and efficiency stats
 */

import { MemoryConsoleHttpClient } from './src/memory-console-client.js';
import type { ContextEngineConfig } from './src/types/index.js';

interface CliOptions {
  url: string;
  token: string;
}

async function status(options: CliOptions) {
  console.log('\n🟡 Long-term Memory Plugin Status\n');
  console.log('─────────────────────────────────\n');

  const client = new MemoryConsoleHttpClient(options.url, options.token);

  try {
    // Check API health
    const entities = await client.listEntities();
    const facts = await client.searchNarrativeFacts('', { limit: 1000 });

    console.log('✅ Memory Console: Connected\n');

    // Efficiency stats
    console.log('📊 Efficiency Statistics:\n');
    console.log(`   Total Entities:      ${entities.length}`);
    console.log(`   Total Facts:        ${facts.length}`);

    // Calculate average confidence
    if (entities.length > 0) {
      const avgConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      console.log(`   Avg Confidence:     ${(avgConfidence * 100).toFixed(1)}%`);
    }

    // Fact types breakdown
    const factTypes = facts.reduce((acc, f) => {
      acc[f.factType] = (acc[f.factType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n   Fact Types:');
    for (const [type, count] of Object.entries(factTypes)) {
      console.log(`      ${type}: ${count}`);
    }

    console.log('\n─────────────────────────────────\n');
  } catch (error) {
    console.log('❌ Memory Console: Connection Failed');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

// Simple CLI parser
const args = process.argv.slice(2);
const command = args[0];

if (command === 'status') {
  const options: CliOptions = {
    url: process.env.MEMORY_CONSOLE_URL || 'http://localhost:3000',
    token: process.env.MEMORY_CONSOLE_TOKEN || '',
  };
  status(options);
} else {
  console.log(`
openclaw-longterm-memory-plugin CLI

Usage:
  npm run cli status    # Health check and statistics

Environment Variables:
  MEMORY_CONSOLE_URL      API URL (default: http://localhost:3000)
  MEMORY_CONSOLE_TOKEN    API Token
  `);
  process.exit(1);
}
