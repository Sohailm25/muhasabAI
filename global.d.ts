// Node.js Environment
declare namespace NodeJS {
  interface ProcessEnv {
    ANTHROPIC_API_KEY?: string;
    DATABASE_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test' | string;
    [key: string]: string | undefined;
  }
}

// Anthropic SDK Declaration
declare module '@anthropic-ai/sdk' {
  export interface AnthropicOptions {
    apiKey: string;
  }

  export interface Message {
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  }

  export interface ContentBlock {
    type: string;
    text?: string;
    [key: string]: any;
  }

  export interface MessageParams {
    model: string;
    messages: Message[];
    max_tokens: number;
    temperature?: number;
  }

  export interface MessageResponse {
    id: string;
    content: ContentBlock[];
    role: string;
    model: string;
    stop_reason: string;
  }

  export class Messages {
    create(params: MessageParams): Promise<MessageResponse>;
  }

  export default class Anthropic {
    constructor(options: AnthropicOptions);
    messages: Messages;
  }
} 