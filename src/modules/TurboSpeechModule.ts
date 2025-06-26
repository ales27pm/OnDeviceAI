/**
 * TurboModule Speech Interface
 * 
 * Implementation for Speech-to-Text and Text-to-Speech functionality
 * Uses TurboModule when available, falls back to mock data for development
 */

import { Platform, DeviceEventEmitter } from 'react-native';
import NativeSpeechModule from '../native/NativeSpeechModule';

// Mock Speech Module Spec interface
export interface Spec {
  // Speech Recognition (STT)
  requestSpeechRecognitionAuthorization(): Promise<boolean>;
  startRecognition(locale: string, requiresOnDeviceRecognition: boolean): Promise<void>;
  stopRecognition(): Promise<void>;
  destroyRecognizer(): Promise<void>;
  
  // Text-to-Speech (TTS)
  getAvailableVoices(): Promise<Object[]>;
  speak(text: string, options: Object): Promise<string>;
  stopSpeaking(): Promise<void>;
  pauseSpeaking(): Promise<void>;
  resumeSpeaking(): Promise<void>;
  
  // Event emitter methods
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// Voice interface
export interface SpeechVoice {
  id: string;
  name: string;
  language: string;
  quality?: 'default' | 'enhanced';
}

// Speech options interface
export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceId?: string;
}

// Mock implementation of the native module
const MockSpeechModule: Spec = {
  async requestSpeechRecognitionAuthorization(): Promise<boolean> {
    // Mock authorization - always grant for development
    return true;
  },
  
  async startRecognition(locale: string, requiresOnDeviceRecognition: boolean): Promise<void> {
    // Mock speech recognition start
    setTimeout(() => {
      DeviceEventEmitter.emit('onSpeechStart', { locale });
      
      // Simulate recognition result after 2 seconds
      setTimeout(() => {
        DeviceEventEmitter.emit('onSpeechResult', { 
          text: 'Hello, this is a mock speech recognition result', 
          confidence: 0.95,
          isFinal: true 
        });
        DeviceEventEmitter.emit('onSpeechEnd');
      }, 2000);
    }, 100);
  },
  
  async stopRecognition(): Promise<void> {
    DeviceEventEmitter.emit('onSpeechEnd');
  },
  
  async destroyRecognizer(): Promise<void> {
    // Mock cleanup
  },
  
  async getAvailableVoices(): Promise<Object[]> {
    return [
      { id: 'en-US-default', name: 'Default Voice', language: 'en-US', quality: 'default' },
      { id: 'en-US-enhanced', name: 'Enhanced Voice', language: 'en-US', quality: 'enhanced' },
      { id: 'es-ES-default', name: 'Spanish Voice', language: 'es-ES', quality: 'default' },
    ];
  },
  
  async speak(text: string, options: Object): Promise<string> {
    const utteranceId = `utterance_${Date.now()}`;
    
    setTimeout(() => {
      DeviceEventEmitter.emit('onSpeechStart', { utteranceId, text });
      
      // Simulate speech progress
      const words = text.split(' ');
      let charIndex = 0;
      
      words.forEach((word, index) => {
        setTimeout(() => {
          charIndex += word.length + (index > 0 ? 1 : 0); // +1 for space
          DeviceEventEmitter.emit('onSpeechProgress', {
            utteranceId,
            charIndex,
            charLength: text.length
          });
        }, index * 200);
      });
      
      // Simulate completion
      setTimeout(() => {
        DeviceEventEmitter.emit('onSpeechFinish', { utteranceId, text });
      }, words.length * 200 + 500);
    }, 100);
    
    return utteranceId;
  },
  
  async stopSpeaking(): Promise<void> {
    // Mock stop
  },
  
  async pauseSpeaking(): Promise<void> {
    // Mock pause
  },
  
  async resumeSpeaking(): Promise<void> {
    // Mock resume
  },
  
  addListener(eventName: string): void {
    // Mock listener
  },
  
  removeListeners(count: number): void {
    // Mock remove
  }
};

// Use the mock module
let NativeSpeechModule: Spec | null = MockSpeechModule;
let speechEventEmitter = DeviceEventEmitter;

/**
 * Speech recognition result interface
 */
export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
}

/**
 * Speech progress information
 */
export interface SpeechProgress {
  utteranceId: string;
  charIndex: number;
  charLength: number;
}

/**
 * Audio level information
 */
export interface AudioLevel {
  level: number; // 0.0 to 1.0
}

/**
 * Recognition status change
 */
export interface RecognitionStatus {
  status?: string;
  available?: boolean;
}

/**
 * Event handler types
 */
export type SpeechEventHandlers = {
  onSpeechStart?: (event: { locale?: string; utteranceId?: string; text?: string }) => void;
  onSpeechResult?: (result: SpeechRecognitionResult) => void;
  onSpeechError?: (error: { error: string }) => void;
  onSpeechEnd?: (result?: any) => void;
  onSpeechProgress?: (progress: SpeechProgress) => void;
  onSpeechFinish?: (event: { utteranceId: string; text?: string }) => void;
  onSpeechPause?: (event: { utteranceId: string }) => void;
  onSpeechResume?: (event: { utteranceId: string }) => void;
  onVolumeChanged?: (level: AudioLevel) => void;
  onRecognitionStatusChanged?: (status: RecognitionStatus) => void;
};

/**
 * TurboModule Speech Service
 * Provides high-performance speech capabilities with native iOS integration
 */
class TurboSpeechModule {
  private static instance: TurboSpeechModule | null = null;
  private eventSubscriptions: Map<string, any> = new Map();
  private isInitialized = false;

  private constructor() {
    if (Platform.OS === 'ios') {
      this.initializeModule();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TurboSpeechModule {
    if (!this.instance) {
      this.instance = new TurboSpeechModule();
    }
    return this.instance;
  }

  /**
   * Initialize the Mock Speech Module
   */
  private async initializeModule(): Promise<void> {
    try {
      if (!NativeSpeechModule) {
        console.warn('🚧 Speech module not available');
        this.isInitialized = false;
        return;
      }

      console.log('🚀 Initializing Mock Speech Module...');
      this.isInitialized = true;
      console.log('✅ Mock Speech Module initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Mock Speech Module:', error);
      this.isInitialized = false;
    }
  }

  // MARK: - Speech Recognition (STT) Methods

  /**
   * Request speech recognition authorization
   */
  async requestSpeechRecognitionAuthorization(): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      const granted = await NativeSpeechModule!.requestSpeechRecognitionAuthorization();
      console.log('🎤 Speech recognition authorization:', granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('❌ Failed to request speech authorization:', error);
      throw error;
    }
  }

  /**
   * Start speech recognition
   */
  async startRecognition(
    locale: string = 'en-US',
    requiresOnDeviceRecognition: boolean = true
  ): Promise<void> {
    this.ensureInitialized();
    
    try {
      console.log(`🎧 Starting speech recognition - Locale: ${locale}, OnDevice: ${requiresOnDeviceRecognition}`);
      await NativeSpeechModule!.startRecognition(locale, requiresOnDeviceRecognition);
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      throw error;
    }
  }

  /**
   * Stop speech recognition
   */
  async stopRecognition(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await NativeSpeechModule!.stopRecognition();
      console.log('⏹️ Speech recognition stopped');
    } catch (error) {
      console.error('❌ Failed to stop speech recognition:', error);
      throw error;
    }
  }

  /**
   * Destroy speech recognizer
   */
  async destroyRecognizer(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await NativeSpeechModule!.destroyRecognizer();
      console.log('🗑️ Speech recognizer destroyed');
    } catch (error) {
      console.error('❌ Failed to destroy recognizer:', error);
      throw error;
    }
  }

  // MARK: - Text-to-Speech (TTS) Methods

  /**
   * Get available speech synthesis voices
   */
  async getAvailableVoices(): Promise<SpeechVoice[]> {
    this.ensureInitialized();
    
    try {
      const voices = await NativeSpeechModule!.getAvailableVoices();
      console.log(`🗣️ Found ${voices.length} available voices`);
      return voices as SpeechVoice[];
    } catch (error) {
      console.error('❌ Failed to get available voices:', error);
      // Return fallback voices
      return [
        { id: 'system-default', name: 'System Default', language: 'en-US', quality: 'default' }
      ];
    }
  }

  /**
   * Speak text with options
   */
  async speak(text: string, options: SpeechOptions = {}): Promise<string> {
    this.ensureInitialized();
    
    try {
      console.log(`🗣️ Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      const utteranceId = await NativeSpeechModule!.speak(text, options);
      return utteranceId;
    } catch (error) {
      console.error('❌ Failed to speak text:', error);
      throw error;
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await NativeSpeechModule!.stopSpeaking();
      console.log('⏹️ Speech synthesis stopped');
    } catch (error) {
      console.error('❌ Failed to stop speaking:', error);
      throw error;
    }
  }

  /**
   * Pause speaking
   */
  async pauseSpeaking(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await NativeSpeechModule!.pauseSpeaking();
      console.log('⏸️ Speech synthesis paused');
    } catch (error) {
      console.error('❌ Failed to pause speaking:', error);
      throw error;
    }
  }

  /**
   * Resume speaking
   */
  async resumeSpeaking(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await NativeSpeechModule!.resumeSpeaking();
      console.log('▶️ Speech synthesis resumed');
    } catch (error) {
      console.error('❌ Failed to resume speaking:', error);
      throw error;
    }
  }

  // MARK: - Event Management

  /**
   * Add event listeners for speech events
   */
  addEventListener(handlers: Partial<SpeechEventHandlers>): () => void {
    if (!this.isNativeModuleAvailable() || !speechEventEmitter) {
      console.warn('📡 Event emitter not available - Mock module not loaded');
      return () => {};
    }

    const subscriptions: any[] = [];

    // Add listeners for each provided handler
    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (handler && speechEventEmitter) {
        try {
          const subscription = speechEventEmitter.addListener(eventName, handler);
          subscriptions.push(subscription);
          this.eventSubscriptions.set(eventName, subscription);
        } catch (error) {
          console.warn(`⚠️  Failed to add listener for ${eventName}:`, error instanceof Error ? error.message : String(error));
        }
      }
    });

    console.log(`📡 Added ${subscriptions.length} speech event listeners`);

    // Return cleanup function
    return () => {
      subscriptions.forEach(subscription => {
        try {
          subscription.remove();
        } catch (error) {
          console.warn('⚠️  Failed to remove subscription:', error instanceof Error ? error.message : String(error));
        }
      });
      console.log(`🧹 Removed ${subscriptions.length} speech event listeners`);
    };
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (!speechEventEmitter) return;

    this.eventSubscriptions.forEach(subscription => subscription.remove());
    this.eventSubscriptions.clear();
    speechEventEmitter.removeAllListeners();
    
    console.log('🧹 All speech event listeners removed');
  }

  // MARK: - Utility Methods

  /**
   * Get module version
   */
  getVersion(): string {
    return '2.0.0-mock';
  }

  /**
   * Check if module is initialized
   */
  async isModuleInitialized(): Promise<boolean> {
    return this.isInitialized && this.isNativeModuleAvailable();
  }

  /**
   * Get module constants
   */
  getConstants(): any {
    return {
      isTurboModule: false,
      platform: Platform.OS,
      newArchitecture: false,
      isMock: true
    };
  }

  /**
   * Quick speak with default options
   */
  async quickSpeak(text: string): Promise<string> {
    return await this.speak(text, {
      rate: 0.5,
      pitch: 1.0,
      volume: 1.0
    });
  }

  /**
   * Set default voice (mock implementation)
   */
  async setDefaultVoice(voiceId: string): Promise<boolean> {
    console.log(`🎯 Setting default voice: ${voiceId}`);
    return true;
  }

  /**
   * Get supported locales (mock implementation)
   */
  async getSupportedLocales(): Promise<string[]> {
    return ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'zh-CN'];
  }

  /**
   * Check if speech recognition is available (mock implementation)
   */
  async isRecognitionAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Configure audio session (mock implementation)
   */
  async configureAudioSession(options?: { 
    category?: string; 
    mode?: string; 
    options?: number 
  }): Promise<boolean> {
    console.log('🔊 Mock audio session configured:', options);
    return true;
  }

  // MARK: - Private Methods

  private ensureInitialized(): void {
    if (!NativeSpeechModule) {
      throw new Error('Speech module not available');
    }
  }

  /**
   * Check if the native module is available
   */
  public isNativeModuleAvailable(): boolean {
    return NativeSpeechModule !== null && typeof NativeSpeechModule === 'object';
  }

  /**
   * Cleanup on app termination
   */
  async cleanup(): Promise<void> {
    try {
      await this.destroyRecognizer();
      this.removeAllListeners();
      console.log('🧹 Mock Speech Module cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export default TurboSpeechModule.getInstance();

// Types are already exported above, no need to re-export