import { SpeechService } from './SpeechService';
import { RagService } from './RagService';
import { AgentExecutorWithStatus } from '../agents/AgentExecutorWithStatus';
import { useToolPermissions } from '../hooks/useToolPermissions';

/**
 * Advanced speech turn logic states
 */
export type ConversationState = 
  | 'idle'           // Not in conversation
  | 'listening'      // Actively listening for user speech
  | 'processing'     // Processing user speech/generating response
  | 'speaking'       // AI is speaking response
  | 'waiting'        // Waiting for user to continue
  | 'interrupted'    // Conversation was interrupted
  | 'error';         // Error state

/**
 * Speech turn detection configuration
 */
export interface SpeechTurnConfig {
  silenceTimeout: number;           // Time of silence before ending turn (ms)
  maxSpeechDuration: number;        // Maximum speech duration (ms)
  minSpeechDuration: number;        // Minimum speech duration for valid input (ms)
  interruptionThreshold: number;    // Audio level threshold for interruption detection
  turnEndConfidence: number;        // Confidence threshold for turn end detection
  continuousMode: boolean;          // Whether to continue listening after response
  autoStart: boolean;               // Auto-start listening after response
  adaptiveSilence: boolean;         // Adapt silence timeout based on context
}

/**
 * Conversation context for adaptive behavior
 */
export interface ConversationContext {
  turnCount: number;
  averageResponseTime: number;
  userSpeechPatterns: {
    averageDuration: number;
    pauseFrequency: number;
    interruptionRate: number;
  };
  conversationTopic: string;
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Voice conversation event callbacks
 */
export interface VoiceConversationCallbacks {
  onStateChange: (state: ConversationState, context: ConversationContext) => void;
  onUserSpeechStart: () => void;
  onUserSpeechEnd: (transcription: string, confidence: number) => void;
  onAIResponseStart: (text: string) => void;
  onAIResponseEnd: () => void;
  onError: (error: any, state: ConversationState) => void;
  onInterruption: (type: 'user' | 'system') => void;
  onAudioLevelUpdate: (level: number) => void;
}

/**
 * Advanced Voice Conversation Manager
 * Implements sophisticated speech turn logic with adaptive behavior and interruption handling
 */
export class VoiceConversationManager {
  private speechService: SpeechService;
  private ragService: RagService;
  private agent: AgentExecutorWithStatus | null = null;
  
  private state: ConversationState = 'idle';
  private config: SpeechTurnConfig;
  private context: ConversationContext;
  private callbacks: Partial<VoiceConversationCallbacks> = {};
  
  // Advanced turn detection
  private turnStartTime: number = 0;
  private lastSpeechTime: number = 0;
  private speechBuffer: number[] = [];
  private adaptiveSilenceTimeout: number;
  private interruptionDetected = false;
  private currentTurnId: string | null = null;
  
  // Timers and intervals
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioLevelMonitor: NodeJS.Timeout | null = null;
  private contextUpdateTimer: NodeJS.Timeout | null = null;
  
  // Performance tracking
  private turnMetrics: {
    startTime: number;
    endTime: number;
    speechDuration: number;
    processingTime: number;
    responseTime: number;
  }[] = [];

  constructor(config?: Partial<SpeechTurnConfig>) {
    this.speechService = SpeechService.getInstance();
    this.ragService = RagService.getInstance();
    
    // Default configuration
    this.config = {
      silenceTimeout: 2000,
      maxSpeechDuration: 30000,
      minSpeechDuration: 500,
      interruptionThreshold: 0.15,
      turnEndConfidence: 0.8,
      continuousMode: true,
      autoStart: true,
      adaptiveSilence: true,
      ...config
    };
    
    // Initialize conversation context
    this.context = {
      turnCount: 0,
      averageResponseTime: 2000,
      userSpeechPatterns: {
        averageDuration: 3000,
        pauseFrequency: 0.2,
        interruptionRate: 0.1
      },
      conversationTopic: 'general',
      complexity: 'medium'
    };
    
    this.adaptiveSilenceTimeout = this.config.silenceTimeout;
  }

  /**
   * Initialize the voice conversation manager
   */
  async initialize(toolPermissions?: ReturnType<typeof useToolPermissions>): Promise<void> {
    try {
      console.log('🎤 Initializing VoiceConversationManager...');
      
      // Initialize speech service
      const speechInitialized = await this.speechService.initialize();
      if (!speechInitialized) {
        throw new Error('Speech service initialization failed');
      }

      // Configure speech recognition with optimal settings
      this.speechService.configureSpeechRecognition({
        language: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
      });

      // Log speech recognition status
      const status = this.speechService.getSpeechRecognitionStatus();
      console.log('🎧 Speech Recognition Status:', status);
      
      // Initialize agent if tools are available
      if (toolPermissions?.availableTools) {
        this.agent = new AgentExecutorWithStatus(toolPermissions.availableTools);
      }
      
      // Start context monitoring
      this.startContextMonitoring();
      
      console.log('✅ VoiceConversationManager initialized');
      
    } catch (error) {
      console.error('❌ VoiceConversationManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set conversation callbacks
   */
  setCallbacks(callbacks: Partial<VoiceConversationCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Start voice conversation with advanced turn management
   */
  async startConversation(): Promise<void> {
    if (this.state !== 'idle') {
      await this.stopConversation();
    }

    try {
      console.log('🗣️  Starting advanced voice conversation');
      
      this.setState('listening');
      await this.startListeningTurn();
      
    } catch (error) {
      console.error('❌ Failed to start voice conversation:', error);
      this.setState('error');
      this.callbacks.onError?.(error, this.state);
    }
  }

  /**
   * Stop voice conversation
   */
  async stopConversation(): Promise<void> {
    console.log('⏹️  Stopping voice conversation');
    
    // Clear all timers
    this.clearAllTimers();
    
    // Stop speech service activities
    await this.speechService.emergencyStop();
    
    this.setState('idle');
    this.currentTurnId = null;
  }

  /**
   * Start listening turn with advanced detection
   */
  private async startListeningTurn(): Promise<void> {
    this.currentTurnId = `turn_${Date.now()}`;
    this.turnStartTime = Date.now();
    this.interruptionDetected = false;
    
    console.log(`👂 Starting listening turn: ${this.currentTurnId}`);
    this.callbacks.onUserSpeechStart?.();
    
    try {
      // Start audio level monitoring
      this.startAudioLevelMonitoring();
      
      // Start speech recognition with advanced options
      await this.speechService.startListening({
        language: 'en-US',
        partialResultsEnabled: true,
        onStart: () => {
          console.log('🎧 Speech recognition started');
        },
        onResult: (result, isFinal) => {
          this.handleSpeechResult(result, isFinal);
        },
        onError: (error) => {
          console.error('❌ Speech recognition error:', error);
          this.handleSpeechError(error);
        },
        onEnd: () => {
          console.log('🏁 Speech recognition ended');
        }
      });
      
      // Set adaptive silence timeout
      this.setSilenceTimeout();
      
    } catch (error) {
      console.error('❌ Failed to start listening turn:', error);
      this.setState('error');
      this.callbacks.onError?.(error, this.state);
    }
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(result: string, isFinal: boolean): void {
    console.log(`🎤 Speech result (${isFinal ? 'final' : 'partial'}): "${result}"`);
    
    if (isFinal && result.trim()) {
      this.processSpeechResult(result.trim());
    } else if (!isFinal) {
      // Update UI with partial results
      this.lastSpeechTime = Date.now();
      this.resetSilenceTimeout();
    }
  }

  /**
   * Process final speech result
   */
  private async processSpeechResult(transcription: string): Promise<void> {
    const speechDuration = Date.now() - this.turnStartTime;
    
    // Validate speech duration
    if (speechDuration < this.config.minSpeechDuration) {
      console.log('⚠️  Speech too short, continuing to listen');
      return;
    }
    
    console.log(`📝 Processing speech: "${transcription}" (${speechDuration}ms)`);
    
    // Stop listening and transition to processing
    await this.speechService.stopListening();
    this.setState('processing');
    // Calculate confidence score based on speech characteristics
    const confidence = this.calculateTranscriptionConfidence(transcription, speechDuration);
    this.callbacks.onUserSpeechEnd?.(transcription, confidence);
    
    try {
      // Generate AI response
      const responseStartTime = Date.now();
      const response = await this.generateResponse(transcription);
      const processingTime = Date.now() - responseStartTime;
      
      // Update metrics
      this.updateTurnMetrics(speechDuration, processingTime);
      
      // Speak response
      if (response && response.trim()) {
        await this.speakResponse(response);
      }
      
      // Continue conversation if in continuous mode
      if (this.config.continuousMode && this.state !== 'error') {
        setTimeout(() => {
          if (this.state === 'idle') {
            this.startListeningTurn();
          }
        }, 1000); // Brief pause before next turn
      }
      
    } catch (error) {
      console.error('❌ Failed to process speech result:', error);
      this.setState('error');
      this.callbacks.onError?.(error, this.state);
    }
  }

  /**
   * Generate AI response using RAG or Agent
   */
  private async generateResponse(userInput: string): Promise<string> {
    console.log('🤖 Generating AI response...');
    
    try {
      if (this.agent && this.shouldUseAgent(userInput)) {
        // Use agent for complex queries
        const result = await this.agent.run(userInput);
        return result.finalAnswer;
      } else {
        // Use RAG for simple queries
        return await this.ragService.answerWithRAG(userInput);
      }
    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      return "I'm sorry, I encountered an error processing your request. Could you please try again?";
    }
  }

  /**
   * Determine if agent should be used for this query
   */
  private shouldUseAgent(input: string): boolean {
    const agentTriggers = [
      'schedule', 'calendar', 'meeting', 'appointment',
      'remember', 'remind', 'note', 'save',
      'search', 'find', 'look up',
      'calculate', 'compute', 'time', 'date'
    ];
    
    const lowerInput = input.toLowerCase();
    return agentTriggers.some(trigger => lowerInput.includes(trigger));
  }

  /**
   * Speak AI response with interruption detection
   */
  private async speakResponse(response: string): Promise<void> {
    console.log(`🗣️  Speaking response: "${response.substring(0, 50)}..."`);
    
    this.setState('speaking');
    this.callbacks.onAIResponseStart?.(response);
    
    // Start interruption detection
    this.startInterruptionDetection();
    
    try {
      await this.speechService.speak(response, {
        rate: 0.8, // Slightly slower for voice conversation
        onStart: () => {
          console.log('🎤 AI speech started');
        },
        onDone: () => {
          console.log('✅ AI speech completed');
          this.setState('idle');
          this.callbacks.onAIResponseEnd?.();
          this.stopInterruptionDetection();
        },
        onStopped: () => {
          console.log('⏹️  AI speech stopped');
          this.setState('idle');
          this.callbacks.onAIResponseEnd?.();
          this.stopInterruptionDetection();
        },
        onError: (error) => {
          console.error('❌ AI speech error:', error);
          this.setState('error');
          this.callbacks.onError?.(error, this.state);
          this.stopInterruptionDetection();
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to speak response:', error);
      this.setState('error');
      this.callbacks.onError?.(error, this.state);
    }
  }

  /**
   * Start audio level monitoring for advanced turn detection
   */
  private startAudioLevelMonitoring(): void {
    this.audioLevelMonitor = setInterval(() => {
      const audioLevel = this.speechService.getCurrentAudioLevel();
      this.callbacks.onAudioLevelUpdate?.(audioLevel);
      
      // Update speech buffer for pattern analysis
      this.speechBuffer.push(audioLevel);
      if (this.speechBuffer.length > 50) {
        this.speechBuffer.shift(); // Keep last 50 samples
      }
    }, 100); // 10 FPS audio level monitoring
  }

  /**
   * Start interruption detection during AI speech
   */
  private startInterruptionDetection(): void {
    this.startAudioLevelMonitoring();
    
    // Check for user interruption every 100ms
    const interruptionCheck = setInterval(() => {
      const audioLevel = this.speechService.getCurrentAudioLevel();
      
      if (audioLevel > this.config.interruptionThreshold && this.state === 'speaking') {
        console.log('🚨 User interruption detected');
        this.handleInterruption();
        clearInterval(interruptionCheck);
      }
    }, 100);
    
    // Store reference to clear later
    this.audioLevelMonitor = interruptionCheck;
  }

  /**
   * Stop interruption detection
   */
  private stopInterruptionDetection(): void {
    if (this.audioLevelMonitor) {
      clearInterval(this.audioLevelMonitor);
      this.audioLevelMonitor = null;
    }
  }

  /**
   * Handle user interruption
   */
  private async handleInterruption(): Promise<void> {
    console.log('🔄 Handling user interruption');
    
    this.interruptionDetected = true;
    this.setState('interrupted');
    this.callbacks.onInterruption?.('user');
    
    // Stop current speech
    await this.speechService.stopSpeaking();
    
    // Start listening for new input
    setTimeout(() => {
      if (this.state === 'interrupted') {
        this.startListeningTurn();
      }
    }, 300); // Brief pause before listening
  }

  /**
   * Set adaptive silence timeout
   */
  private setSilenceTimeout(): void {
    if (this.config.adaptiveSilence) {
      // Adapt timeout based on conversation context
      this.adaptiveSilenceTimeout = this.calculateAdaptiveSilenceTimeout();
    } else {
      this.adaptiveSilenceTimeout = this.config.silenceTimeout;
    }
    
    this.resetSilenceTimeout();
  }

  /**
   * Reset silence timeout
   */
  private resetSilenceTimeout(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    
    this.silenceTimer = setTimeout(() => {
      if (this.state === 'listening') {
        console.log('🔇 Silence timeout reached, ending turn');
        this.endListeningTurn();
      }
    }, this.adaptiveSilenceTimeout);
  }

  /**
   * Calculate adaptive silence timeout based on context
   */
  private calculateAdaptiveSilenceTimeout(): number {
    const baseTimeout = this.config.silenceTimeout;
    const contextMultiplier = this.context.complexity === 'complex' ? 1.5 : 1.0;
    const patternMultiplier = this.context.userSpeechPatterns.pauseFrequency > 0.3 ? 1.3 : 1.0;
    
    return Math.min(baseTimeout * contextMultiplier * patternMultiplier, 5000);
  }

  /**
   * End listening turn
   */
  private async endListeningTurn(): Promise<void> {
    console.log('🏁 Ending listening turn');
    
    const transcription = await this.speechService.stopListening();
    if (transcription && transcription.trim()) {
      await this.processSpeechResult(transcription.trim());
    } else {
      console.log('⚠️  No speech detected, returning to idle');
      this.setState('idle');
    }
  }

  /**
   * Handle speech recognition error
   */
  private handleSpeechError(error: any): void {
    console.error('🚨 Speech recognition error:', error);
    this.setState('error');
    this.callbacks.onError?.(error, this.state);
  }

  /**
   * Update conversation state
   */
  private setState(newState: ConversationState): void {
    const previousState = this.state;
    this.state = newState;
    
    console.log(`🔄 State change: ${previousState} → ${newState}`);
    this.callbacks.onStateChange?.(newState, this.context);
  }

  /**
   * Update turn metrics
   */
  private updateTurnMetrics(speechDuration: number, processingTime: number): void {
    const turnMetric = {
      startTime: this.turnStartTime,
      endTime: Date.now(),
      speechDuration,
      processingTime,
      responseTime: processingTime + speechDuration
    };
    
    this.turnMetrics.push(turnMetric);
    
    // Keep only last 20 turns for analysis
    if (this.turnMetrics.length > 20) {
      this.turnMetrics.shift();
    }
    
    // Update conversation context
    this.updateConversationContext();
  }

  /**
   * Update conversation context based on metrics
   */
  private updateConversationContext(): void {
    if (this.turnMetrics.length === 0) return;
    
    const recent = this.turnMetrics.slice(-5); // Last 5 turns
    
    this.context.turnCount++;
    this.context.averageResponseTime = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
    this.context.userSpeechPatterns.averageDuration = recent.reduce((sum, m) => sum + m.speechDuration, 0) / recent.length;
    
    // Update complexity based on response times
    if (this.context.averageResponseTime > 3000) {
      this.context.complexity = 'complex';
    } else if (this.context.averageResponseTime > 1500) {
      this.context.complexity = 'medium';
    } else {
      this.context.complexity = 'simple';
    }
    
    console.log('📊 Context updated:', this.context);
  }

  /**
   * Start context monitoring
   */
  private startContextMonitoring(): void {
    this.contextUpdateTimer = setInterval(() => {
      if (this.state !== 'idle') {
        this.updateConversationContext();
      }
    }, 5000); // Update context every 5 seconds
  }

  /**
   * Clear all timers
   */
  private clearAllTimers(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    if (this.audioLevelMonitor) {
      clearInterval(this.audioLevelMonitor);
      this.audioLevelMonitor = null;
    }
    
    if (this.contextUpdateTimer) {
      clearInterval(this.contextUpdateTimer);
      this.contextUpdateTimer = null;
    }
  }

  /**
   * Get current conversation state
   */
  getState(): ConversationState {
    return this.state;
  }

  /**
   * Get conversation context
   */
  getContext(): ConversationContext {
    return { ...this.context };
  }

  /**
   * Get turn metrics
   */
  getTurnMetrics(): typeof this.turnMetrics {
    return [...this.turnMetrics];
  }

  /**
   * Calculate transcription confidence based on speech characteristics
   */
  private calculateTranscriptionConfidence(transcription: string, speechDuration: number): number {
    let confidence = 0.7; // Base confidence
    
    // Factor in speech duration - longer speech generally more reliable
    if (speechDuration > 2000) {
      confidence += 0.1;
    } else if (speechDuration < 500) {
      confidence -= 0.2;
    }
    
    // Factor in transcription length and coherence
    const wordCount = transcription.split(' ').filter(word => word.trim().length > 0).length;
    if (wordCount > 5) {
      confidence += 0.1;
    } else if (wordCount < 2) {
      confidence -= 0.2;
    }
    
    // Factor in presence of complete words (no fragmented text)
    const hasCompleteWords = /^[a-zA-Z\s,.!?'-]+$/.test(transcription);
    if (hasCompleteWords) {
      confidence += 0.1;
    }
    
    // Factor in sentence structure
    const hasPunctuation = /[.!?]/.test(transcription);
    if (hasPunctuation) {
      confidence += 0.05;
    }
    
    // Ensure confidence is within bounds
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SpeechTurnConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️  Configuration updated:', this.config);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up VoiceConversationManager');
    
    await this.stopConversation();
    this.clearAllTimers();
    await this.speechService.cleanup();
  }
}