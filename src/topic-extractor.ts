/**
 * Topic Extractor
 * 
 * Extracts session topics/keywords from message history
 */

// Stopwords to filter out
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'just', 'also', 'very', 'too', 'quite', 'rather',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
  'your', 'yours', 'yourself', 'he', 'him', 'his', 'she', 'her', 'it',
  'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'any', 'thanks',
  'thank', 'please', 'sorry', 'help', 'hi', 'hello', 'hey', 'okay', 'ok',
]);

// Important tech keywords to prioritize
const TECH_KEYWORDS = new Set([
  'docker', 'kubernetes', 'postgres', 'postgresql', 'mysql', 'mongodb',
  'redis', 'nginx', 'traefik', 'linux', 'ubuntu', 'debian', 'macos',
  'windows', 'api', 'rest', 'graphql', 'http', 'https', 'tcp', 'udp',
  'ssl', 'tls', 'git', 'github', 'gitlab', 'npm', 'yarn', 'pnpm',
  'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c++',
  'openclaw', 'agent', 'plugin', 'memory', 'context', 'session',
  'model', 'llm', 'embedding', 'vector', 'rag', 'ai', 'ml',
  'nuc', 'server', 'cloud', 'aws', 'gcp', 'azure', 'docker-compose',
]);

/**
 * Extract session topic from message history
 */
export function extractSessionTopic(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return '';
  }

  // Get recent messages (last 5)
  const recentMessages = messages.slice(-5);
  
  // Extract all words
  const wordCounts = new Map<string, number>();
  
  for (const msg of recentMessages) {
    const content = extractContent(msg);
    if (!content) continue;
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    for (const word of words) {
      if (STOPWORDS.has(word)) continue;
      
      // Boost tech keywords
      const boost = TECH_KEYWORDS.has(word) ? 3 : 1;
      wordCounts.set(word, (wordCounts.get(word) || 0) + boost);
    }
  }

  // Sort by frequency
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return sorted.join(', ');
}

/**
 * Extract content from message
 */
function extractContent(msg: any): string {
  if (!msg) return '';
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.content)) {
    return msg.content.map((p: any) => p.text || p.content || '').join(' ');
  }
  return '';
}
