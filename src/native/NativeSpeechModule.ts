/**
 * TurboModule Specification for Speech-to-Text and Text-to-Speech
 * 
 * This defines the interface between JavaScript and native iOS Speech APIs
 * using the New Architecture TurboModule system for maximum performance.
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Speech voice interface for available system voices
 */
export interface SpeechVoice {
  id: string;
  name: string;
  language: string;
  quality?: number;
  gender?: number;
}

/**
 * Text-to-speech options
 */
export interface SpeechOptions {
  voiceId?: string;
  rate?: number;        // 0.0 to 1.0
  pitch?: number;       // 0.5 to 2.0
  volume?: number;      // 0.0 to 1.0
}

/**
 * TurboModule specification interface for SpeechModule
 * This interface will be used by React Native Codegen to generate native bindings
 */
export interface Spec extends TurboModule {
  // Event emitter methods (required for events)
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  // Speech Recognition (STT) Methods
  requestSpeechRecognitionAuthorization(): Promise<boolean>;
  startRecognition(locale: string, requiresOnDeviceRecognition: boolean): Promise<void>;
  stopRecognition(): Promise<void>;
  destroyRecognizer(): Promise<void>;
  
  // Enhanced STT methods
  isRecognitionAvailable(): Promise<boolean>;
  getSupportedLocales(): Promise<string[]>;
  
  // Text-to-Speech (TTS) Methods
  getAvailableVoices(): Promise<SpeechVoice[]>;
  speak(text: string, options: SpeechOptions): Promise<string>; // returns utteranceId
  stopSpeaking(): Promise<void>;
  pauseSpeaking(): Promise<void>;
  resumeSpeaking(): Promise<void>;
  
  // Enhanced TTS methods
  isSpeaking(): Promise<boolean>;
  isPaused(): Promise<boolean>;
  setDefaultVoice(voiceId: string): Promise<boolean>;
  
  // Audio session management
  configureAudioSession(): Promise<void>;
  releaseAudioSession(): Promise<void>;
  
  // Utility methods
  getVersion(): Promise<string>;
  isInitialized(): Promise<boolean>;
}

// Export the Spec interface as default for React Native Codegen
export default TurboModuleRegistry.get<Spec>('SpeechModule');

// Event types that the module can emit
export type SpeechEventType = 
  | 'onSpeechStart'
  | 'onSpeechResult'
  | 'onSpeechError'
  | 'onSpeechEnd'
  | 'onSpeechProgress'
  | 'onSpeechFinish'
  | 'onSpeechPause'
  | 'onSpeechResume'
  | 'onVolumeChanged'
  | 'onRecognitionStatusChanged';