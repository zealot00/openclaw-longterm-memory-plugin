/**
 * Message Parser
 * 
 * Extracts text content from AgentMessage objects
 */

interface TextPart {
  type: 'text';
  text: string;
}

interface MessagePart {
  type: string;
  text?: string;
  content?: string;
}

type AgentMessage = {
  role: string;
  content: string | TextPart[] | MessagePart[];
};

/**
 * Extract text content from an AgentMessage
 */
export function extractMessageContent(message: unknown): string {
  if (!message) {
    return '';
  }

  const msg = message as AgentMessage;
  
  // Handle string content
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  // Handle array content (multi-part messages)
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((part: any) => part.text || part.content || '')
      .filter(Boolean)
      .join(' ');
  }

  return '';
}
