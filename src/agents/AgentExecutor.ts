import { RagService } from '../services/RagService';
import { MemoryService } from '../services/MemoryService';
import { CalendarModule } from '../modules/CalendarModule';
import { NativeCalendarModule } from '../modules/NativeCalendarModule';
import { Tool } from '../hooks/useToolPermissions';

/**
 * Action interface for parsed agent actions
 */
interface AgentAction {
  tool: string;
  action: string;
  args: Record<string, any>;
}

/**
 * Agent execution result
 */
interface AgentResult {
  success: boolean;
  finalAnswer: string;
  steps: string[];
  executionTime: number;
  totalSteps: number;
}

/**
 * Agent configuration
 */
interface AgentConfig {
  maxIterations: number;
  timeoutMs: number;
  retryAttempts: number;
  temperature: number;
}

/**
 * AgentExecutor implements a reasoning loop with tool dispatch capabilities
 * Follows the ReAct pattern: Reason, Act, Observe
 */
export class AgentExecutor {
  private ragService: RagService;
  private memoryService: MemoryService;
  private calendarModule: CalendarModule;
  private nativeCalendarModule: NativeCalendarModule;
  private history: string[] = [];
  private availableTools: Tool[] = [];
  private config: AgentConfig;

  constructor(availableTools: Tool[], config?: Partial<AgentConfig>) {
    this.ragService = RagService.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.calendarModule = CalendarModule.getInstance();
    this.nativeCalendarModule = NativeCalendarModule.getInstance();
    this.availableTools = availableTools;
    
    // Default configuration
    this.config = {
      maxIterations: 10,
      timeoutMs: 60000, // 1 minute
      retryAttempts: 3,
      temperature: 0.7,
      ...config
    };
  }

  /**
   * Main execution method - runs the agent reasoning loop
   */
  async run(userQuery: string): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Initialize services
      await this.initializeServices();
      
      // Clear previous history
      this.history = [];
      
      // Build the initial system prompt
      const systemPrompt = this.buildSystemPrompt();
      
      // Start the reasoning loop
      const result = await this.executeReasoningLoop(systemPrompt, userQuery);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        finalAnswer: result,
        steps: [...this.history],
        executionTime,
        totalSteps: this.history.length
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Agent execution failed:', error);
      
      return {
        success: false,
        finalAnswer: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        steps: [...this.history],
        executionTime,
        totalSteps: this.history.length
      };
    }
  }

  /**
   * Initialize required services
   */
  private async initializeServices(): Promise<void> {
    try {
      await this.memoryService.initialize();
      
      // Try to initialize legacy calendar module (will fail gracefully on web)
      try {
        await this.calendarModule.initialize();
      } catch (error) {
        console.warn('Legacy calendar module initialization failed:', error);
      }
      
      // Try to initialize native calendar module (iOS only)
      try {
        await this.nativeCalendarModule.initialize();
        console.log('✅ Native calendar module initialized');
      } catch (error) {
        console.warn('⚠️  Native calendar module initialization failed, using Expo Calendar fallback:', error);
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

    return `You are an intelligent AI assistant with access to various tools. Your goal is to help users by thinking through problems step by step and using available tools when needed.

AVAILABLE TOOLS:
${toolDescriptions}

INSTRUCTIONS:
1. Think step by step about the user's request
2. Use the following format for your responses:

Thought: [Your reasoning about what to do next]
Action: {"tool": "toolName", "action": "actionDescription", "args": {...}}
Observation: [This will be filled by the system after the action executes]

3. Continue the Thought-Action-Observation cycle until you can provide a final answer
4. When you have enough information to answer the user's question, respond with:

Final Answer: [Your complete response to the user]

IMPORTANT RULES:
- Always start with a Thought
- Actions must be valid JSON objects with "tool", "action", and "args" fields
- Only use tools that are listed in the AVAILABLE TOOLS section
- Be concise but thorough in your thinking
- If a tool action fails, try alternative approaches
- Always end with "Final Answer:" when you can answer the user's question`;
  }

  /**
   * Execute the main reasoning loop
   */
  private async executeReasoningLoop(systemPrompt: string, userQuery: string): Promise<string> {
    let fullPrompt = `${systemPrompt}\n\nUser Query: ${userQuery}\n\n`;
    let iteration = 0;
    const timeout = setTimeout(() => {
      throw new Error('Agent execution timeout');
    }, this.config.timeoutMs);

    try {
      while (iteration < this.config.maxIterations) {
        iteration++;
        
        // Add history to prompt
        if (this.history.length > 0) {
          fullPrompt += this.history.join('\n') + '\n';
        }

        // Get response from RAG service
        const response = await this.ragService.answerWithCustomPrompt(
          fullPrompt,
          '',
          false // Don't use memory context for agent reasoning
        );

        // Parse the response
        const parseResult = await this.parseAgentResponse(response);
        
        if (parseResult.type === 'final_answer') {
          clearTimeout(timeout);
          return parseResult.content || 'No final answer provided';
        }
        
        if (parseResult.type === 'action') {
          // Add thought to history
          if (parseResult.thought) {
            this.history.push(`Thought: ${parseResult.thought}`);
          }
          
          // Add action to history
          this.history.push(`Action: ${JSON.stringify(parseResult.action)}`);
          
          // Execute the action
          if (parseResult.action) {
            const observation = await this.executeAction(parseResult.action);
            this.history.push(`Observation: ${observation}`);
          }
          
        } else if (parseResult.type === 'thought_only') {
          // Just thinking, add to history and continue
          this.history.push(`Thought: ${parseResult.content}`);
        } else {
          // Invalid response, add error and continue
          this.history.push(`Observation: Invalid response format. Please follow the Thought-Action-Observation format.`);
        }
        
        // Brief pause to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      clearTimeout(timeout);
      throw new Error(`Agent reached maximum iterations (${this.config.maxIterations}) without providing a final answer`);
      
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Parse agent response to extract thoughts, actions, or final answers
   */
  private async parseAgentResponse(response: string): Promise<{
    type: 'thought_only' | 'action' | 'final_answer';
    thought?: string;
    action?: AgentAction;
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

      // Extract thought
      const thoughtMatch = response.match(/Thought:\s*(.*?)(?=\nAction:|$)/s);
      const thought = thoughtMatch?.[1]?.trim();

      // Extract action
      const actionMatch = response.match(/Action:\s*(\{.*?\})/s);
      
      if (actionMatch) {
        let parsedAction: AgentAction;
        let parseAttempts = 0;
        
        while (parseAttempts < this.config.retryAttempts) {
          try {
            parsedAction = JSON.parse(actionMatch[1]);
            
            // Validate action structure
            if (!parsedAction.tool || !parsedAction.action || !parsedAction.args) {
              throw new Error('Action must have tool, action, and args fields');
            }
            
            return {
              type: 'action',
              thought,
              action: parsedAction
            };
            
          } catch (parseError) {
            parseAttempts++;
            console.warn(`JSON parse attempt ${parseAttempts} failed:`, parseError);
            
            if (parseAttempts >= this.config.retryAttempts) {
              return {
                type: 'thought_only',
                content: `Failed to parse action JSON after ${this.config.retryAttempts} attempts. Please provide valid JSON format.`
              };
            }
            
            // Try to fix common JSON issues
            const fixedJson = this.attemptJsonFix(actionMatch[1]);
            if (fixedJson !== actionMatch[1]) {
              try {
                parsedAction = JSON.parse(fixedJson);
                return {
                  type: 'action',
                  thought,
                  action: parsedAction
                };
              } catch (error) {
                // Continue to next attempt
              }
            }
          }
        }
      }

      // If we have a thought but no action, return thought only
      if (thought) {
        return {
          type: 'thought_only',
          content: thought
        };
      }

      // Fallback
      return {
        type: 'thought_only',
        content: response.trim()
      };

    } catch (error) {
      console.error('Error parsing agent response:', error);
      return {
        type: 'thought_only',
        content: 'Failed to parse response format'
      };
    }
  }

  /**
   * Attempt to fix common JSON parsing issues
   */
  private attemptJsonFix(jsonString: string): string {
    return jsonString
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":')  // Add quotes around unquoted keys
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
  }

  /**
   * Execute a parsed action using the appropriate tool
   */
  private async executeAction(action: AgentAction): Promise<string> {
    try {
      // Validate that the tool is available
      const tool = this.availableTools.find(t => t.name === action.tool);
      if (!tool) {
        return `Error: Tool '${action.tool}' is not available. Available tools: ${this.availableTools.map(t => t.name).join(', ')}`;
      }

      switch (action.tool) {
        case 'addMemory':
          return await this.executeAddMemory(action.args);
        
        case 'searchMemory':
          return await this.executeSearchMemory(action.args);
        
        case 'getCalendarEvents':
          return await this.executeGetCalendarEvents(action.args);
        
        case 'createCalendarEvent':
          return await this.executeCreateCalendarEvent(action.args);
        
        case 'getCurrentTime':
          return await this.executeGetCurrentTime();
        
        case 'calculateDaysBetween':
          return await this.executeCalculateDaysBetween(action.args);
        
        default:
          return `Error: Unknown tool '${action.tool}'`;
      }

    } catch (error) {
      console.error(`Error executing action ${action.tool}:`, error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }

  /**
   * Execute addMemory action
   */
  private async executeAddMemory(args: any): Promise<string> {
    const { content, metadata } = args;
    
    if (!content) {
      return 'Error: content parameter is required for addMemory';
    }
    
    const memoryId = await this.memoryService.addMemory(content, metadata || {});
    return `Memory added successfully with ID: ${memoryId}`;
  }

  /**
   * Execute searchMemory action
   */
  private async executeSearchMemory(args: any): Promise<string> {
    const { query, limit = 5 } = args;
    
    if (!query) {
      return 'Error: query parameter is required for searchMemory';
    }
    
    const results = await this.memoryService.queryMemory(query, limit);
    
    if (results.length === 0) {
      return 'No relevant memories found';
    }
    
    return `Found ${results.length} relevant memories:\n${results.map((result, i) => `${i + 1}. ${result}`).join('\n')}`;
  }

  /**
   * Execute getCalendarEvents action
   */
  private async executeGetCalendarEvents(args: any): Promise<string> {
    const { startDate, endDate } = args;
    
    if (!startDate || !endDate) {
      return 'Error: startDate and endDate parameters are required for getCalendarEvents';
    }
    
    // Try native calendar first, fallback to legacy module
    try {
      if (this.nativeCalendarModule.isAvailable()) {
        const events = await this.nativeCalendarModule.getEventsForDateRange(startDate, endDate);
        
        if (events.length === 0) {
          return `No calendar events found between ${startDate} and ${endDate}`;
        }
        
        return `Found ${events.length} events:\n${events.map(event => 
          `- ${event.title} (${event.startDate})`
        ).join('\n')}`;
      }
    } catch (error) {
      console.warn('Native calendar failed, trying legacy:', error);
    }
    
    // Fallback to legacy calendar module
    if (!this.calendarModule.isAvailable()) {
      return 'Calendar functionality is not available on this platform';
    }
    
    const events = await this.calendarModule.getCalendarEvents(startDate, endDate);
    
    if (events.length === 0) {
      return `No calendar events found between ${startDate} and ${endDate}`;
    }
    
    return `Found ${events.length} events:\n${events.map(event => 
      `- ${event.title} (${event.startDate.toLocaleString()} - ${event.endDate.toLocaleString()})`
    ).join('\n')}`;
  }

  /**
   * Execute createCalendarEvent action
   */
  private async executeCreateCalendarEvent(args: any): Promise<string> {
    const { title, startDate, endDate, notes, location } = args;
    
    if (!title || !startDate) {
      return 'Error: title and startDate parameters are required for createCalendarEvent';
    }
    
    // Try native calendar first, fallback to legacy module
    try {
      if (this.nativeCalendarModule.isAvailable()) {
        const eventId = await this.nativeCalendarModule.createEvent(
          title, startDate, endDate || startDate, location
        );
        
        return `Calendar event '${title}' created successfully with native module. ID: ${eventId}`;
      }
    } catch (error) {
      console.warn('Native calendar creation failed, trying legacy:', error);
    }
    
    // Fallback to legacy calendar module
    if (!this.calendarModule.isAvailable()) {
      return 'Calendar functionality is not available on this platform';
    }
    
    const eventId = await this.calendarModule.createCalendarEvent(
      title, startDate, endDate || startDate, notes, location
    );
    
    return `Calendar event '${title}' created successfully with legacy module. ID: ${eventId}`;
  }

  /**
   * Execute getCurrentTime action
   */
  private async executeGetCurrentTime(): Promise<string> {
    const now = new Date();
    return `Current date and time: ${now.toLocaleString()}`;
  }

  /**
   * Execute calculateDaysBetween action
   */
  private async executeCalculateDaysBetween(args: any): Promise<string> {
    const { startDate, endDate } = args;
    
    if (!startDate || !endDate) {
      return 'Error: startDate and endDate parameters are required for calculateDaysBetween';
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Error: Invalid date format. Please use ISO format (YYYY-MM-DD)';
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `There are ${diffDays} days between ${startDate} and ${endDate}`;
  }

  /**
   * Get the execution history
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Clear the execution history
   */
  clearHistory(): void {
    this.history = [];
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

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }
}