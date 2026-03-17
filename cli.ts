/**
 * CLI for openclaw-longterm-memory-plugin
 * 
 * Commands:
 *   status    - Health check and efficiency stats
 */

interface CliOptions {
  url: string;
  token: string;
}

interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  namespace: string;
  tags: string[];
  createdAt: string;
}

async function status(options: CliOptions) {
  console.log('\n🟡 Long-term Memory Plugin Status\n');
  console.log('─────────────────────────────────\n');

  try {
    // Fetch memories
    const response = await fetch(`${options.url}/api/memories?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${options.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const memories: MemoryEntry[] = data.items || [];

    console.log('✅ Memory Console: Connected\n');

    // Efficiency stats
    console.log('📊 Efficiency Statistics:\n');
    console.log(`   Total Memories:    ${memories.length}`);

    // Tag distribution
    const tagCounts: Record<string, number> = {};
    memories.forEach(m => {
      m.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Namespace distribution
    const namespaceCounts: Record<string, number> = {};
    memories.forEach(m => {
      namespaceCounts[m.namespace || 'default'] = (namespaceCounts[m.namespace || 'default'] || 0) + 1;
    });

    // Source breakdown
    const sourceCounts: Record<string, number> = {};
    memories.forEach(m => {
      const source = m.content.substring(0, 30) + (m.content.length > 30 ? '...' : '');
      sourceCounts[m.source || 'unknown'] = (sourceCounts[m.source || 'unknown'] || 0) + 1;
    });

    console.log('\n   Namespaces:');
    for (const [ns, count] of Object.entries(namespaceCounts)) {
      console.log(`      ${ns}: ${count}`);
    }

    if (Object.keys(tagCounts).length > 0) {
      console.log('\n   Top Tags:');
      const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [tag, count] of sortedTags) {
        console.log(`      ${tag}: ${count}`);
      }
    }

    // Recent memories
    console.log('\n   Recent Memories:');
    const recent = memories.slice(0, 3);
    for (const m of recent) {
      console.log(`      - ${m.title || m.content.substring(0, 40)}`);
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
