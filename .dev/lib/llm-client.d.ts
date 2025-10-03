export interface LLMChatMessage {
  role: string;
  content: string;
}

export interface LLMChatOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export class LLMClient {
  constructor(options?: Record<string, unknown>);
  chat(messages: LLMChatMessage[], options?: LLMChatOptions): Promise<string>;
}
