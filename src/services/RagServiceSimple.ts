import { EmbeddingService } from './EmbeddingService';
import { MemoryService } from './MemoryService';
import { getOpenAITextResponse, getAnthropicTextResponse, getGrokTextResponse } from '../api/chat-service';
import { AIMessage } from '../types/ai';

/**
 * Simplified RAG Service without streaming to avoid Metro bundling issues
 * This provides the same functionality but uses the existing non-streaming APIs
 */
export class RagServiceSimple {
  private static instance: RagServiceSimple | null = null;
  private memoryService: MemoryService;
  private preferredProvider: 'openai' | 'anthropic' | 'grok';

  private constructor() {
    this.memoryService = MemoryService.getInstance();
    this.preferredProvider = this.determinePreferredProvider();
  }

  static getInstance(): RagServiceSimple {
    if (!this.instance) {
      this.instance = new RagServiceSimple();
    }
    return this.instance;
  }

  private determinePreferredProvider(): 'openai' | 'anthropic' | 'grok' {
    try {
      const openaiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
      const anthropicKey = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
      const grokKey = process.env.EXPO_PUBLIC_VIBECODE_GROK_API_KEY;

      // Check for valid keys (not demo keys)
      if (openaiKey && openaiKey.length > 10 && !openaiKey.includes('n0tr3al')) return 'openai';
      if (anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes('n0tr3al')) return 'anthropic';
      if (grokKey && grokKey.length > 10 && !grokKey.includes('n0tr3al')) return 'grok';
      
      // Default to OpenAI
      return 'openai';
    } catch (error) {
      console.warn('Error determining provider, defaulting to OpenAI:', error);
      return 'openai';
    }
  }

  async answerWithRAG(query: string, contextCount: number = 3): Promise<string> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    try {
      // Ensure memory service is initialized
      await this.memoryService.initialize();

      // Retrieve relevant context from memory
      console.log(`Retrieving top ${contextCount} relevant contexts...`);
      const contexts = await this.memoryService.queryMemory(query.trim(), contextCount);

      // Construct augmented prompt
      const augmentedPrompt = this.constructAugmentedPrompt(query.trim(), contexts);

      // Get response from preferred AI provider
      console.log(`Getting response from ${this.preferredProvider}...`);
      const response = await this.getResponse(augmentedPrompt);

      return response;

    } catch (error) {
      console.error('RAG Service error:', error);
      
      // Fallback to simple response without context
      try {
        const fallbackPrompt = `Question: ${query}\n\nAnswer:`;
        const fallbackResponse = await this.getResponse(fallbackPrompt);
        return `${fallbackResponse}\n\n(Note: This response was generated without memory context due to an error.)`;
      } catch (fallbackError) {
        return `I apologize, but I'm unable to process your request at the moment. The question was: "${query}"`;
      }
    }
  }

  private constructAugmentedPrompt(query: string, contexts: string[]): string {
    const contextSection = contexts.length > 0 
      ? `Context:\n---\n${contexts.join('\n\n')}\n---\n\n`
      : '';

    return `${contextSection}Question: ${query}\n\nAnswer:`;
  }

  private async getResponse(prompt: string): Promise<string> {
    const messages: AIMessage[] = [{ role: 'user', content: prompt }];

    try {
      switch (this.preferredProvider) {
        case 'openai':
          const openaiResponse = await getOpenAITextResponse(messages, {
            temperature: 0.7,
            maxTokens: 1024
          });
          return openaiResponse.content;

        case 'anthropic':
          const anthropicResponse = await getAnthropicTextResponse(messages, {
            temperature: 0.7,
            maxTokens: 1024
          });
          return anthropicResponse.content;

        case 'grok':
          const grokResponse = await getGrokTextResponse(messages, {
            temperature: 0.7,
            maxTokens: 1024
          });
          return grokResponse.content;

        default:
          throw new Error(`Unsupported provider: ${this.preferredProvider}`);
      }
    } catch (error) {
      console.error(`${this.preferredProvider} API error:`, error);
      throw new Error(`Failed to get response from ${this.preferredProvider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async answerWithCustomPrompt(
    query: string, 
    systemPrompt: string, 
    useContext: boolean = true
  ): Promise<string> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    try {
      let contexts: string[] = [];
      
      if (useContext) {
        await this.memoryService.initialize();
        contexts = await this.memoryService.queryMemory(query.trim(), 3);
      }

      const contextSection = contexts.length > 0 
        ? `Context:\n---\n${contexts.join('\n\n')}\n---\n\n`
        : '';

      const fullPrompt = `${systemPrompt}\n\n${contextSection}User Query: ${query}\n\nResponse:`;
      
      return await this.getResponse(fullPrompt);

    } catch (error) {
      console.error('Custom prompt RAG error:', error);
      throw new Error(`Failed to answer with custom prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getPreferredProvider(): string {
    return this.preferredProvider;
  }

  setPreferredProvider(provider: 'openai' | 'anthropic' | 'grok'): void {
    this.preferredProvider = provider;
  }

  async testRAG(): Promise<{ query: string; contexts: string[]; response: string }> {
    const testQuery = "What do you know about mobile development?";
    
    try {
      await this.memoryService.initialize();
      
      const contexts = await this.memoryService.queryMemory(testQuery, 3);
      const response = await this.answerWithRAG(testQuery);
      
      return {
        query: testQuery,
        contexts,
        response
      };
      
    } catch (error) {
      console.error('RAG test failed:', error);
      throw error;
    }
  }
}