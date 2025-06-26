import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Simplified Speech Service for reliable TTS functionality
 * Focuses on text-to-speech without complex recording features
 */
export class SimpleSpeechService {
  private static instance: SimpleSpeechService | null = null;
  private isSpeaking = false;
  private availableVoices: any[] = [];
  private currentVoice: any = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SimpleSpeechService {
    if (!this.instance) {
      this.instance = new SimpleSpeechService();
    }
    return this.instance;
  }

  /**
   * Initialize speech service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎤 Initializing Simple Speech Service...');

      // Load available voices
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const voices = await Speech.getAvailableVoicesAsync();
        this.availableVoices = voices;
        
        // Set default voice (prefer high-quality English voice)
        this.currentVoice = voices.find(v => 
          v.language?.startsWith('en') && v.quality === 'Enhanced'
        ) || voices[0] || null;

        console.log(`🗣️  Loaded ${voices.length} TTS voices`);
        if (this.currentVoice) {
          console.log(`🎯 Default voice: ${this.currentVoice.name} (${this.currentVoice.language})`);
        }
      }

      console.log('✅ Simple Speech Service initialized');
    } catch (error) {
      console.error('❌ Simple Speech Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Speak text with options
   */
  async speak(text: string, options?: {
    voice?: string;
    language?: string;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: any) => void;
  }): Promise<void> {
    if (this.isSpeaking) {
      await this.stopSpeaking();
    }

    try {
      this.isSpeaking = true;
      console.log(`🗣️  Speaking: "${text.substring(0, 50)}..."`);

      const speechOptions: Speech.SpeechOptions = {
        language: options?.language || this.currentVoice?.language || 'en-US',
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.75,
        voice: options?.voice || this.currentVoice?.identifier,
        onStart: () => {
          console.log('🎤 TTS started');
          options?.onStart?.();
        },
        onDone: () => {
          console.log('✅ TTS completed');
          this.isSpeaking = false;
          options?.onDone?.();
        },
        onStopped: () => {
          console.log('⏹️  TTS stopped');
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('❌ TTS error:', error);
          this.isSpeaking = false;
          options?.onError?.(error);
        }
      };

      await Speech.speak(text, speechOptions);

    } catch (error) {
      console.error('❌ TTS speak failed:', error);
      this.isSpeaking = false;
      throw error;
    }
  }

  /**
   * Stop current speech
   */
  async stopSpeaking(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
      console.log('⏹️  TTS stopped');
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): any[] {
    return [...this.availableVoices];
  }

  /**
   * Set current voice
   */
  setVoice(voiceId: string): boolean {
    const voice = this.availableVoices.find(v => v.identifier === voiceId);
    if (voice) {
      this.currentVoice = voice;
      console.log(`🎯 Voice changed to: ${voice.name}`);
      return true;
    }
    return false;
  }

  /**
   * Get current voice
   */
  getCurrentVoice(): any {
    return this.currentVoice;
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.stopSpeaking();
    console.log('🧹 Simple Speech Service cleanup completed');
  }
}