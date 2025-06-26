import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModal } from '../contexts/ModalContext';
import TurboSpeechModule from '../modules/TurboSpeechModule';
import type { 
  SpeechVoice, 
  SpeechRecognitionResult, 
  SpeechProgress,
  SpeechEventHandlers 
} from '../modules/TurboSpeechModule';

export const TurboSpeechDemo: React.FC = () => {
  const { showAlert } = useModal();
  
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionText, setRecognitionText] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechVoice | null>(null);
  const [supportedLocales, setSupportedLocales] = useState<string[]>([]);
  const [currentUtteranceId, setCurrentUtteranceId] = useState<string>('');
  const [speechProgress, setSpeechProgress] = useState<SpeechProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      initializeTurboModule();
      setupEventListeners();
    }

    return () => {
      cleanup();
    };
  }, []);

  const initializeTurboModule = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Initializing TurboSpeech module...');
      
      // Check if module is initialized
      try {
        const initialized = await TurboSpeechModule.isModuleInitialized();
        setIsInitialized(initialized);
        
        if (initialized) {
          // Load voices and locales
          await loadVoicesAndLocales();
          
          console.log('✅ TurboSpeech module ready');
          console.log('📊 Module version:', TurboSpeechModule.getVersion());
          console.log('🔧 Module constants:', TurboSpeechModule.getConstants());
        } else {
          console.log('⚠️  TurboSpeech module not fully initialized');
          setIsInitialized(false);
        }
      } catch (moduleError) {
        console.warn('🚧 TurboModule not available:', moduleError instanceof Error ? moduleError.message : String(moduleError));
        setIsInitialized(false);
        
        // Show user-friendly message
        showAlert(
          'TurboModule Not Available',
          'The TurboModule Speech implementation is not available. This may be because:\n\n• The app is running on simulator\n• TurboModule not compiled with New Architecture\n• Missing native module registration\n\nPlease try the regular Voice Assistant instead.',
          [{ text: 'OK' }],
          'warning'
        );
      }
    } catch (error) {
      console.error('❌ Failed to initialize TurboSpeech:', error);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVoicesAndLocales = async () => {
    try {
      // Load available voices
      const availableVoices = await TurboSpeechModule.getAvailableVoices();
      setVoices(availableVoices);
      
      // Set default voice (prefer enhanced English voice)
      const defaultVoice = availableVoices.find(v => 
        v.language.startsWith('en') && v.quality === 'enhanced'
      ) || availableVoices[0];
      
      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
        await TurboSpeechModule.setDefaultVoice(defaultVoice.id);
      }
      
      // Load supported locales
      const locales = await TurboSpeechModule.getSupportedLocales();
      setSupportedLocales(locales);
      
      console.log(`🗣️ Loaded ${availableVoices.length} voices and ${locales.length} locales`);
    } catch (error) {
      console.warn('⚠️  Failed to load voices/locales (using fallback):', error instanceof Error ? error.message : String(error));
      
      // Provide fallback data
      setVoices([
        { id: 'fallback-voice', name: 'System Default', language: 'en-US', quality: 'default' }
      ]);
      setSupportedLocales(['en-US', 'en-GB']);
    }
  };

  const setupEventListeners = () => {
    const handlers: SpeechEventHandlers = {
      onSpeechStart: (event) => {
        console.log('🎤 Speech started:', event);
        if (event.locale) {
          setIsRecognizing(true);
        }
        if (event.utteranceId) {
          setCurrentUtteranceId(event.utteranceId);
          setIsSpeaking(true);
        }
      },
      
      onSpeechResult: (result: SpeechRecognitionResult) => {
        console.log('📝 Speech result:', result);
        setRecognitionText(result.text);
        setConfidenceScore(result.confidence);
        
        if (result.isFinal) {
          setIsRecognizing(false);
        }
      },
      
      onSpeechError: (error) => {
        console.error('❌ Speech error:', error);
        setIsRecognizing(false);
        showAlert('Speech Error', error.error, [{ text: 'OK' }], 'error');
      },
      
      onSpeechEnd: (result) => {
        console.log('🏁 Speech ended:', result);
        setIsRecognizing(false);
      },
      
      onSpeechProgress: (progress: SpeechProgress) => {
        setSpeechProgress(progress);
      },
      
      onSpeechFinish: (event) => {
        console.log('✅ Speech synthesis finished:', event);
        setIsSpeaking(false);
        setCurrentUtteranceId('');
        setSpeechProgress(null);
      },
      
      onSpeechPause: (event) => {
        console.log('⏸️ Speech paused:', event);
      },
      
      onSpeechResume: (event) => {
        console.log('▶️ Speech resumed:', event);
      },
      
      onVolumeChanged: (level) => {
        setAudioLevel(level.level);
      },
      
      onRecognitionStatusChanged: (status) => {
        console.log('📊 Recognition status changed:', status);
      }
    };

    return TurboSpeechModule.addEventListener(handlers);
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await TurboSpeechModule.requestSpeechRecognitionAuthorization();
      setHasPermission(granted);
      
      if (granted) {
        showAlert('Permission Granted', 'Speech recognition is now available!', [{ text: 'OK' }], 'success');
      } else {
        showAlert('Permission Denied', 'Speech recognition requires microphone permission.', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      showAlert('Permission Error', `Failed to request permission: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecognition = async () => {
    if (!hasPermission) {
      await requestPermission();
      return;
    }

    setIsLoading(true);
    try {
      setRecognitionText('');
      setConfidenceScore(0);
      await TurboSpeechModule.startRecognition('en-US', true);
      console.log('🎧 Speech recognition started');
    } catch (error) {
      console.error('❌ Failed to start recognition:', error);
      showAlert('Recognition Error', `Failed to start recognition: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecognition = async () => {
    try {
      await TurboSpeechModule.stopRecognition();
      setIsRecognizing(false);
    } catch (error) {
      console.error('❌ Failed to stop recognition:', error);
    }
  };

  const testTextToSpeech = async () => {
    setIsLoading(true);
    try {
      const testText = "Hello! This is a test of the TurboModule text-to-speech functionality. I'm speaking with high-performance native iOS speech synthesis.";
      await TurboSpeechModule.speak(testText, {
        rate: 0.5,
        pitch: 1.0,
        volume: 1.0,
        voiceId: selectedVoice?.id
      });
    } catch (error) {
      console.error('❌ TTS test failed:', error);
      showAlert('TTS Error', `Text-to-speech failed: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      await TurboSpeechModule.stopSpeaking();
      setIsSpeaking(false);
    } catch (error) {
      console.error('❌ Failed to stop speaking:', error);
    }
  };

  const cleanup = async () => {
    try {
      await TurboSpeechModule.cleanup();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="phone-portrait-outline" size={64} color="#9CA3AF" />
          <Text style={styles.title}>iOS Only Feature</Text>
          <Text style={styles.subtitle}>
            TurboModule Speech is only available on iOS devices with New Architecture
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TurboModule Speech Demo</Text>
          <Text style={styles.subtitle}>
            High-Performance Speech-to-Text & Text-to-Speech
          </Text>
          {isLoading && <ActivityIndicator style={styles.loader} size="small" color="#3B82F6" />}
        </View>

        {/* Module Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Module Status</Text>
          
          {!isInitialized ? (
            <View style={styles.notAvailableContainer}>
              <Ionicons name="construct" size={48} color="#F59E0B" />
              <Text style={styles.notAvailableTitle}>TurboModule Not Available</Text>
              <Text style={styles.notAvailableText}>
                The TurboModule Speech implementation requires:
              </Text>
              <Text style={styles.requirementText}>• iOS device (not simulator)</Text>
              <Text style={styles.requirementText}>• New Architecture enabled</Text>
              <Text style={styles.requirementText}>• Compiled native modules</Text>
              <Text style={styles.requirementText}>• Proper Codegen configuration</Text>
              
              <Pressable style={[styles.button, styles.primaryButton]} onPress={initializeTurboModule}>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Retry Initialization</Text>
              </Pressable>
              
              <Text style={styles.fallbackText}>
                💡 Tip: Try the "Chat" tab for the working voice assistant
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statusGrid}>
                <View style={[styles.statusItem, isInitialized ? styles.statusSuccess : styles.statusWarning]}>
                  <Ionicons 
                    name={isInitialized ? "checkmark-circle" : "warning"} 
                    size={20} 
                    color={isInitialized ? "#10B981" : "#F59E0B"} 
                  />
                  <Text style={styles.statusText}>
                    {isInitialized ? 'TurboModule Ready' : 'Not Initialized'}
                  </Text>
                </View>
                
                <View style={[styles.statusItem, hasPermission ? styles.statusSuccess : styles.statusWarning]}>
                  <Ionicons 
                    name={hasPermission ? "mic" : "mic-off"} 
                    size={20} 
                    color={hasPermission ? "#10B981" : "#F59E0B"} 
                  />
                  <Text style={styles.statusText}>
                    {hasPermission ? 'Permission Granted' : 'Permission Required'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.infoText}>
                Version: {TurboSpeechModule.getVersion()}
              </Text>
              <Text style={styles.infoText}>
                Voices: {voices.length} • Locales: {supportedLocales.length}
              </Text>
            </>
          )}
        </View>

        {/* Speech Recognition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Recognition (STT)</Text>
          
          {!hasPermission ? (
            <Pressable style={[styles.button, styles.primaryButton]} onPress={requestPermission}>
              <Ionicons name="mic" size={20} color="white" />
              <Text style={styles.buttonText}>Request Permission</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.buttonRow}>
                <Pressable 
                  style={[styles.button, styles.successButton, !isRecognizing && styles.buttonDisabled]} 
                  onPress={startRecognition}
                  disabled={isRecognizing || isLoading}
                >
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.buttonText}>Start Recognition</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.dangerButton]} 
                  onPress={stopRecognition}
                  disabled={!isRecognizing}
                >
                  <Ionicons name="stop" size={20} color="white" />
                  <Text style={styles.buttonText}>Stop</Text>
                </Pressable>
              </View>
              
              {/* Recognition Status */}
              {isRecognizing && (
                <View style={styles.recognitionStatus}>
                  <Ionicons name="radio-button-on" size={16} color="#EF4444" />
                  <Text style={styles.recognitionText}>Listening...</Text>
                  <View style={styles.audioLevel}>
                    <View style={[styles.audioLevelBar, { width: `${audioLevel * 100}%` }]} />
                  </View>
                </View>
              )}
              
              {/* Recognition Result */}
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Recognition Result:</Text>
                <Text style={styles.resultText}>
                  {recognitionText || 'Start speaking to see transcription...'}
                </Text>
                {confidenceScore > 0 && (
                  <Text style={styles.confidenceText}>
                    Confidence: {(confidenceScore * 100).toFixed(1)}%
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Text-to-Speech */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text-to-Speech (TTS)</Text>
          
          {selectedVoice && (
            <View style={styles.voiceInfo}>
              <Text style={styles.voiceLabel}>Selected Voice:</Text>
              <Text style={styles.voiceName}>
                {selectedVoice.name} ({selectedVoice.language})
              </Text>
              <Text style={styles.voiceQuality}>Quality: {selectedVoice.quality}</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.button, styles.primaryButton]} 
              onPress={testTextToSpeech}
              disabled={isSpeaking || isLoading}
            >
              <Ionicons name="volume-high" size={20} color="white" />
              <Text style={styles.buttonText}>Test TTS</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.dangerButton]} 
              onPress={stopSpeaking}
              disabled={!isSpeaking}
            >
              <Ionicons name="stop" size={20} color="white" />
              <Text style={styles.buttonText}>Stop</Text>
            </Pressable>
          </View>
          
          {/* Speech Progress */}
          {isSpeaking && speechProgress && (
            <View style={styles.speechProgress}>
              <Text style={styles.progressLabel}>Speaking Progress:</Text>
              <Text style={styles.progressText}>
                Character: {speechProgress.charIndex} - {speechProgress.charIndex + speechProgress.charLength}
              </Text>
            </View>
          )}
        </View>

        {/* Voice Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Voices ({voices.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voicesList}>
            {voices.slice(0, 5).map((voice) => (
              <Pressable
                key={voice.id}
                style={[
                  styles.voiceCard,
                  selectedVoice?.id === voice.id && styles.voiceCardSelected
                ]}
                onPress={() => setSelectedVoice(voice)}
              >
                <Text style={styles.voiceCardName}>{voice.name}</Text>
                <Text style={styles.voiceCardLang}>{voice.language}</Text>
                <Text style={styles.voiceCardQuality}>{voice.quality}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            TurboModule • New Architecture • Bridgeless Communication
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loader: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  statusWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recognitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  recognitionText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  audioLevel: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioLevelBar: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  resultContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  voiceInfo: {
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginBottom: 16,
  },
  voiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  voiceQuality: {
    fontSize: 14,
    color: '#6B7280',
  },
  speechProgress: {
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#111827',
  },
  voicesList: {
    marginTop: 12,
  },
  voiceCard: {
    width: 120,
    padding: 12,
    marginRight: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voiceCardSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  voiceCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  voiceCardLang: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  voiceCardQuality: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  notAvailableContainer: {
    alignItems: 'center',
    padding: 20,
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 12,
    marginBottom: 8,
  },
  notAvailableText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginVertical: 2,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TurboSpeechDemo;