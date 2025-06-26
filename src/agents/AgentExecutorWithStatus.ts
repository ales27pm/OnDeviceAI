import { RagService } from '../services/RagService';
import { MemoryService } from '../services/MemoryService';
import { CalendarModule } from '../modules/CalendarModule';
import { Tool } from '../hooks/useToolPermissions';
import { AgentStatus } from '../types/chat';

/**
 * Agent configuration interface
 */
interface AgentConfig {
  maxIterations: number;
  timeoutMs: number;
  retryAttempts: number;
  temperature: number;
}

/**
 * Enhanced AgentExecutor with status tracking for UI integration
 * Standalone implementation with status callbacks for real-time UI updates
 */
export class AgentExecutorWithStatus {
  protected ragService: RagService;
  private memoryService: MemoryService;
  private calendarModule: CalendarModule;
  private availableTools: Tool[] = [];
  private config: AgentConfig;
  private history: string[] = [];
  
  private statusCallback: ((status: Partial<AgentStatus>) => void) | null = null;
  private currentStatus: AgentStatus = {
    isThinking: false,
    currentAction: null,
    toolsInUse: [],
    step: null,
    progress: 0
  };

  constructor(availableTools: Tool[], config?: Partial<AgentConfig>) {
    this.ragService = RagService.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.calendarModule = CalendarModule.getInstance();
    this.availableTools = availableTools;
    
    // Default configuration
    this.config = {
      maxIterations: 10,
      timeoutMs: 60000,
      retryAttempts: 3,
      temperature: 0.7,
      ...config
    };
  }

  /**
   * Set callback for status updates
   */
  setStatusCallback(callback: (status: Partial<AgentStatus>) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Update status and notify callback
   */
  private updateStatus(updates: Partial<AgentStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates };
    if (this.statusCallback) {
      this.statusCallback(updates);
    }
  }

  /**
   * Enhanced run method with status tracking
   */
  async run(userQuery: string): Promise<any> {
    this.updateStatus({
      isThinking: true,
      currentAction: 'Initializing...',
      step: 'Starting reasoning process',
      progress: 0,
      toolsInUse: []
    });

    try {
      // Initialize services with status updates
      this.updateStatus({
        currentAction: 'Initializing services...',
        progress: 0.1
      });

      await this.initializeServices();

      this.updateStatus({
        currentAction: 'Building system prompt...',
        progress: 0.2
      });

      // Clear previous history and build prompt
      this.clearHistory();
      const systemPrompt = this.buildSystemPrompt();

      this.updateStatus({
        currentAction: 'Starting reasoning loop...',
        step: 'Analyzing user query',
        progress: 0.3
      });

      // Execute with enhanced tracking
      const result = await this.executeReasoningLoopWithStatus(systemPrompt, userQuery);

      this.updateStatus({
        isThinking: false,
        currentAction: null,
        step: 'Complete',
        progress: 1.0,
        toolsInUse: []
      });

      return {
        success: true,
        finalAnswer: result,
        steps: this.getHistory(),
        executionTime: 0, // Will be calculated by caller
        totalSteps: this.getHistory().length
      };

    } catch (error) {
      this.updateStatus({
        isThinking: false,
        currentAction: 'Error occurred',
        step: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 0,
        toolsInUse: []
      });

      throw error;
    }
  }

  /**
   * Enhanced reasoning loop with status updates
   */
  private async executeReasoningLoopWithStatus(systemPrompt: string, userQuery: string): Promise<string> {
    let fullPrompt = `${systemPrompt}\n\nUser Query: ${userQuery}\n\n`;
    let iteration = 0;
    const maxIterations = this.getConfig().maxIterations;

    while (iteration < maxIterations) {
      iteration++;
      const progress = 0.3 + (iteration / maxIterations) * 0.6; // Progress from 0.3 to 0.9

      this.updateStatus({
        currentAction: 'Thinking...',
        step: `Reasoning iteration ${iteration}/${maxIterations}`,
        progress
      });

      // Add history to prompt
      const history = this.getHistory();
      if (history.length > 0) {
        fullPrompt += history.join('\n') + '\n';
      }

      this.updateStatus({
        currentAction: 'Generating response...',
        step: `Processing with AI model`
      });

      // Get response from RAG service
      const response = await this.getRAGResponse(fullPrompt);

      this.updateStatus({
        currentAction: 'Parsing response...',
        step: 'Analyzing AI response'
      });

      // Parse the response
      const parseResult = await this.parseAgentResponse(response);

      if (parseResult.type === 'final_answer') {
        this.updateStatus({
          currentAction: 'Finalizing...',
          step: 'Preparing final answer',
          progress: 0.95
        });
        return parseResult.content || 'No final answer provided';
      }

      if (parseResult.type === 'action') {
        // Add thought to history
        if (parseResult.thought) {
          this.addToHistory(`Thought: ${parseResult.thought}`);
        }

        // Add action to history
        this.addToHistory(`Action: ${JSON.stringify(parseResult.action)}`);

        const toolName = parseResult.action.tool;
        this.updateStatus({
          currentAction: `Using ${toolName}...`,
          step: `Executing ${toolName} tool`,
          toolsInUse: [toolName]
        });

        // Execute the action
        const observation = await this.executeAction(parseResult.action);
        this.addToHistory(`Observation: ${observation}`);

        this.updateStatus({
          toolsInUse: []
        });

      } else if (parseResult.type === 'thought_only') {
        // Just thinking, add to history and continue
        this.addToHistory(`Thought: ${parseResult.content}`);
      } else {
        // Invalid response, add error and continue
        this.addToHistory(`Observation: Invalid response format. Please follow the Thought-Action-Observation format.`);
      }

      // Brief pause to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Agent reached maximum iterations (${maxIterations}) without providing a final answer`);
  }

  /**
   * Get RAG response (to be overridden for streaming)
   */
  protected async getRAGResponse(prompt: string): Promise<string> {
    return await this.ragService.answerWithCustomPrompt(prompt, '', false);
  }

  /**
   * Add entry to conversation history
   */
  protected addToHistory(entry: string) {
    this.history.push(entry);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get current status
   */
  getCurrentStatus(): AgentStatus {
    return { ...this.currentStatus };
  }

  /**
   * Reset status
   */
  resetStatus(): void {
    this.currentStatus = {
      isThinking: false,
      currentAction: null,
      toolsInUse: [],
      step: null,
      progress: 0
    };
    
    if (this.statusCallback) {
      this.statusCallback(this.currentStatus);
    }
  }

  /**
   * Initialize required services
   */
  private async initializeServices(): Promise<void> {
    try {
      await this.memoryService.initialize();
      
      // Try to initialize calendar module (will fail gracefully on web)
      try {
        await this.calendarModule.initialize();
      } catch (error) {
        console.warn('Calendar module initialization failed:', error);
      }
      
    } catch (error) {
      console.error('Service initialization failed:', error);
      throw new Error('Failed to initialize agent services');
    }
  }

  /**
   * Build the system prompt with available tools
   */
  private buildSystemPrompt(): string {
    const toolDescriptions = this.availableTools.map(tool => {
      const params = Object.entries(tool.parameters)
        .map(([key, param]) => {
          const required = param.required ? ' (required)' : ' (optional)';
          return `    ${key} (${param.type}): ${param.description}${required}`;
        })
        .join('\n');
      
      return `${tool.name}: ${tool.description}\n  Parameters:\n${params || '    None'}`;
    }).join('\n\n');

    return `You are an intelligent AI assistant. Use the available tools when needed and respond with "Final Answer:" when complete.

AVAILABLE TOOLS:
${toolDescriptions}`;
  }

  /**
   * Parse agent response to extract thoughts, actions, or final answers
   */
  private async parseAgentResponse(response: string): Promise<{
    type: 'thought_only' | 'action' | 'final_answer';
    thought?: string;
    action?: any;
    content?: string;
  }> {
    try {
      // Check for final answer
      const finalAnswerMatch = response.match(/Final Answer:\s*(.*)/s);
      if (finalAnswerMatch) {
        return {
          type: 'final_answer',
          content: finalAnswerMatch[1].trim()
        };
      }

      // For simplicity, return the response as final answer
      return {
        type: 'final_answer',
        content: response.trim()
      };

    } catch (error) {
      console.error('Error parsing agent response:', error);
      return {
        type: 'final_answer',
        content: response.trim()
      };
    }
  }

  /**
   * Execute a simple action (simplified for demo)
   */
  private async executeAction(action: any): Promise<string> {
    return "Action executed successfully.";
  }

  /**
   * Get the execution history
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Update available tools
   */
  updateAvailableTools(tools: Tool[]): void {
    this.availableTools = tools;
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}

/**
 * Streaming version of AgentExecutor for real-time token updates
 */
export class StreamingAgentExecutor extends AgentExecutorWithStatus {
  private tokenCallback: ((token: string) => void) | null = null;

  /**
   * Set callback for streaming tokens
   */
  setTokenCallback(callback: (token: string) => void): void {
    this.tokenCallback = callback;
  }

  /**
   * Override RAG response to support streaming
   */
  protected async getRAGResponse(prompt: string): Promise<string> {
    // For now, use the regular response
    // In a full implementation, this would stream tokens to the callback
    const response = await this.ragService.answerWithCustomPrompt(prompt, '', false);
    
    // Simulate streaming by sending tokens one by one
    if (this.tokenCallback) {
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const token = words[i] + (i < words.length - 1 ? ' ' : '');
        this.tokenCallback(token);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
      }
    }
    
    return response;
  }
}