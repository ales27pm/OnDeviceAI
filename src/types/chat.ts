/**
 * Chat message types and interfaces
 */

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'streaming';
  metadata?: {
    tokenCount?: number;
    processingTime?: number;
    reasoningSteps?: string[];
    toolsUsed?: string[];
    error?: string;
  };
}

export interface AgentStatus {
  isThinking: boolean;
  currentAction: string | null;
  toolsInUse: string[];
  step: string | null;
  progress: number; // 0-1
}

export interface StreamingState {
  isStreaming: boolean;
  buffer: string;
  tokenCount: number;
  startTime: number;
}

export interface ChatPerformanceMetrics {
  timeToFirstToken: number;
  tokensPerSecond: number;
  totalTokens: number;
  processingTime: number;
  memoryUsage: number;
  energyUsage?: number;
}

export interface ChatScreenState {
  messages: ChatMessage[];
  inputText: string;
  isLoading: boolean;
  agentStatus: AgentStatus;
  streamingState: StreamingState;
  performanceMetrics: ChatPerformanceMetrics | null;
}

export type ChatAction = 
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AGENT_STATUS'; payload: Partial<AgentStatus> }
  | { type: 'UPDATE_STREAMING'; payload: Partial<StreamingState> }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: ChatPerformanceMetrics | null }
  | { type: 'CLEAR_MESSAGES' };