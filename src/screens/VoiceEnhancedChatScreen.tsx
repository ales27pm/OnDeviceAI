import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RagService } from '../services/RagService';
import { FileProcessingService } from '../services/FileProcessingService';
import { SpeechService } from '../services/SpeechService';
import { VoiceConversationManager } from '../services/VoiceConversationManager';
import { usePerformanceLogger } from '../hooks/usePerformanceLogger';
import { useToolPermissions } from '../hooks/useToolPermissions';
import { VoiceInteractionUI } from '../components/VoiceInteractionUI';
import { VoiceSelectionModal } from '../components/VoiceSelectionModal';
import { ConversationManager } from '../components/ConversationManager';
import { useChatStore } from '../state/chatStore';
import { useModal } from '../contexts/ModalContext';

/**
 * Enhanced chat message interface with voice support
 */
interface VoiceEnhancedChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'speaking';
  isVoiceMessage?: boolean;
  audioLevel?: number;
  processingTime?: number;
}

/**
 * Message bubble component with voice indicators
 */
const VoiceMessageBubble = React.memo<{
  message: VoiceEnhancedChatMessage;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
}>(({ message, onSpeak, onStopSpeaking, isSpeaking }) => {
  const isUser = message.role === 'user';
  const hasError = message.status === 'error';
  const speakingThisMessage = message.status === 'speaking' || isSpeaking;
  
  // Pulse animation for speaking messages
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (speakingThisMessage) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [speakingThisMessage, pulseAnim]);

  const handleSpeakPress = () => {
    if (speakingThisMessage) {
      onStopSpeaking?.();
    } else {
      onSpeak?.(message.content);
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.botMessageContainer,
    ]}>
      <Animated.View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble,
        hasError && styles.errorBubble,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText,
          hasError && styles.errorText
        ]}>
          {message.content}
        </Text>
        
        {/* Voice indicators */}
        <View style={styles.messageControls}>
          {message.isVoiceMessage && (
            <View style={styles.voiceIndicator}>
              <Ionicons name="mic" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.voiceLabel}>Voice</Text>
            </View>
          )}
          
          {/* Speak button for assistant messages */}
          {!isUser && (
            <Pressable
              style={[
                styles.speakButton,
                speakingThisMessage && styles.speakButtonActive
              ]}
              onPress={handleSpeakPress}
            >
              <Ionicons 
                name={speakingThisMessage ? "stop" : "volume-high"} 
                size={14} 
                color="rgba(255,255,255,0.8)" 
              />
            </Pressable>
          )}
        </View>
      </Animated.View>
      
      {/* Message metadata */}
      <View style={styles.messageMetadata}>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        {message.processingTime && (
          <Text style={styles.processingTime}>
            {message.processingTime}ms
          </Text>
        )}
      </View>
    </View>
  );
});

/**
 * Voice-enhanced chat screen with advanced speech capabilities
 */
export const VoiceEnhancedChatScreen: React.FC = () => {
  // Hooks
  const insets = useSafeAreaInsets();
  const performanceLogger = usePerformanceLogger();
  const toolPermissions = useToolPermissions();
  const { showAlert, showConfirm, showPrompt } = useModal();
  
  // Services
  const [ragService] = useState(() => RagService.getInstance());
  const [speechService] = useState(() => SpeechService.getInstance());
  const [voiceManager] = useState(() => new VoiceConversationManager());
  const [fileProcessingService] = useState(() => FileProcessingService.getInstance());
  
  // State from Zustand store
  const {
    getCurrentConversation,
    getConversationMessages,
    addMessage,
    updateMessage,
    clearConversation,
    createConversation,
    setLoading,
    setCurrentSpeakingId,
    setVoiceMode,
    isLoading,
    currentSpeakingId,
    isVoiceMode,
  } = useChatStore();
  
  // Local state
  const [inputText, setInputText] = useState('');
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [showVoiceSelection, setShowVoiceSelection] = useState(false);
  const [showConversationManager, setShowConversationManager] = useState(false);
  const [voicePermissionGranted, setVoicePermissionGranted] = useState(false);
  
  // Get messages from store
  const messages = getConversationMessages().map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
  })) as VoiceEnhancedChatMessage[];

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Initialize speech services
  useEffect(() => {
    initializeSpeechServices();
    
    // Cleanup function
    return () => {
      // Stop any ongoing speech synthesis
      speechService.stopSpeaking?.();
      speechService.cleanup?.();
      
      // Stop any ongoing voice conversation
      voiceManager.stopConversation?.();
    };
  }, []);

  // Check permission status
  const checkPermissionStatus = async () => {
    try {
      const { Audio } = require('expo-av');
      const { status } = await Audio.getPermissionsAsync();
      console.log('🎤 Current permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('❌ Failed to check permissions:', error);
      return false;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const initializeSpeechServices = async () => {
    try {
      console.log('🎤 Starting speech services initialization...');
      
      const speechInitialized = await speechService.initialize();
      console.log('🎤 Speech service initialized:', speechInitialized);
      
      if (!speechInitialized) {
        console.log('🎤 Speech service initialization failed, but continuing...');
        // Don't throw error - we can still try voice manager
      }
      
      await voiceManager.initialize(toolPermissions);
      console.log('🎤 Voice manager initialized');
      
      setVoicePermissionGranted(true);
      console.log('✅ Speech services initialized successfully');
      
      // Show success feedback
      showAlert(
        'Voice Features Ready',
        'Microphone access granted! You can now use voice features.',
        [{ text: 'OK' }],
        'success'
      );
      
    } catch (error) {
      console.error('❌ Speech services initialization failed:', error);
      setVoicePermissionGranted(false);
      
      // Show helpful error message
      showAlert(
        'Voice Setup Failed',
        'Unable to set up voice features. Please check your microphone permissions in device settings.',
        [
          { text: 'OK' },
          { 
            text: 'Open Settings', 
            onPress: () => Linking.openSettings().catch(console.error)
          }
        ],
        'error'
      );
    }
  };

  // Message renderer
  const renderMessage = useCallback(({ item }: { item: VoiceEnhancedChatMessage }) => (
    <VoiceMessageBubble 
      message={item}
      onSpeak={handleSpeakMessage}
      onStopSpeaking={handleStopSpeaking}
      isSpeaking={currentSpeakingId === item.id}
    />
  ), [currentSpeakingId]);

  // Key extractor
  const keyExtractor = useCallback((item: VoiceEnhancedChatMessage) => item.id, []);

  // Send text message
  const sendTextMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    // Ensure we have a conversation
    const currentConversation = getCurrentConversation();
    if (!currentConversation) {
      createConversation();
    }

    const messageContent = inputText.trim();
    addMessage({
      content: messageContent,
      role: 'user',
      status: 'sent',
      isVoiceMessage: false
    });

    setInputText('');
    setLoading(true);

    await processUserMessage(messageContent, false);
  }, [inputText, isLoading, getCurrentConversation, createConversation, addMessage, setLoading]);

  // Process user message (from text or voice)
  const processUserMessage = async (content: string, isVoice: boolean) => {
    performanceLogger.startTiming('message-processing');
    
    try {
      const response = await ragService.answerWithEnhancedRAG(content);
      const processingTime = performanceLogger.endTiming('message-processing');
      
      const botMessageId = addMessage({
        content: response,
        role: 'assistant',
        status: 'sent',
        isVoiceMessage: false,
        processingTime
      });
      
      // Auto-speak response in voice mode
      if (isVoice && isVoiceMode) {
        setTimeout(() => {
          handleSpeakMessage(response, botMessageId);
        }, 500);
      }

    } catch (error) {
      console.error('❌ Message processing failed:', error);
      
      // End timing even on error
      performanceLogger.endTiming('message-processing');
      
      addMessage({
        content: 'I encountered an error processing your request. Please try again.',
        role: 'assistant',
        status: 'error',
        isVoiceMessage: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle voice transcription
  const handleVoiceTranscription = (transcription: string) => {
    console.log('🎤 Voice transcription:', transcription);
    
    addMessage({
      content: transcription,
      role: 'user',
      status: 'sent',
      isVoiceMessage: true
    });
    processUserMessage(transcription, true);
  };

  // Handle AI voice response
  const handleVoiceResponse = (response: string) => {
    console.log('🗣️  AI voice response:', response);
    // This is handled by the voice UI, we just log it here
  };

  // Speak a message
  const handleSpeakMessage = async (text: string, messageId?: string) => {
    try {
      if (currentSpeakingId) {
        await speechService.stopSpeaking();
      }
      
      setCurrentSpeakingId(messageId || null);
      
      await speechService.speak(text, {
        rate: 0.8,
        onDone: () => {
          setCurrentSpeakingId(null);
        },
        onStopped: () => {
          setCurrentSpeakingId(null);
        },
        onError: (error) => {
          console.error('TTS error:', error);
          setCurrentSpeakingId(null);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to speak message:', error);
      setCurrentSpeakingId(null);
    }
  };

  // Stop speaking
  const handleStopSpeaking = async () => {
    try {
      await speechService.stopSpeaking();
      setCurrentSpeakingId(null);
    } catch (error) {
      console.error('❌ Failed to stop speaking:', error);
    }
  };

  // Toggle voice mode
  const toggleVoiceMode = () => {
    console.log('🎤 toggleVoiceMode called, voicePermissionGranted:', voicePermissionGranted);
    
    if (!voicePermissionGranted) {
      console.log('🎤 Voice permission not granted, requesting...');
      Alert.alert(
        'Voice Permission Required',
        'Please grant microphone permission to use voice features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Settings', 
            onPress: async () => {
              console.log('🎤 Opening device settings...');
              try {
                // Try to open app-specific settings
                await Linking.openSettings();
                
                // Show a follow-up dialog for when they return
                setTimeout(() => {
                  Alert.alert(
                    'Return from Settings',
                    'Did you grant microphone permission? Tap "Try Again" to test voice features.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Try Again', onPress: initializeSpeechServices }
                    ]
                  );
                }, 1000);
                
              } catch (error) {
                console.error('❌ Failed to open settings:', error);
                // Fallback: try to initialize services again
                initializeSpeechServices();
              }
            }
          }
        ]
      );
      return;
    }
    
    console.log('🎤 Toggling voice mode from', isVoiceMode, 'to', !isVoiceMode);
    setVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      console.log('🎤 Opening voice UI');
      setShowVoiceUI(true);
    }
  };

  // Clear chat
  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ragService.uploadFile();
      
      const uploadMessage: VoiceEnhancedChatMessage = {
        id: Date.now().toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        status: 'sent',
        isVoiceMessage: false
      };

      addMessage({
        content: `📁 File uploaded successfully`,
        role: 'user',
        status: 'sent',
        isVoiceMessage: false
      });
    } catch (error) {
      console.error('❌ File upload failed:', error);
      showAlert('Upload Failed', 'Failed to upload file. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  }, [ragService, addMessage, setLoading]);

  // Handle web search
  const handleWebSearch = useCallback(async () => {
    const searchQuery = await showPrompt(
      'Web Search',
      'What would you like to search for?',
      undefined,
      {
        placeholder: 'Enter your search query...',
        maxLength: 200
      }
    );

    if (searchQuery && searchQuery.trim()) {
      try {
        setLoading(true);

        addMessage({
          content: `🔍 Searching: ${searchQuery}`,
          role: 'user',
          status: 'sent',
          isVoiceMessage: false
        });

        const response = await ragService.searchWeb(searchQuery);

        addMessage({
          content: response,
          role: 'assistant',
          status: 'sent',
          isVoiceMessage: false
        });
      } catch (error) {
        console.error('❌ Web search failed:', error);
        showAlert('Search Failed', 'Failed to search the web. Please try again.', [{ text: 'OK' }], 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [ragService, addMessage, setLoading, showAlert, showPrompt]);

  const clearChat = useCallback(() => {
    showConfirm(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      () => {
        clearConversation();
        handleStopSpeaking();
      }
    );
  }, [showConfirm, clearConversation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingBottom: insets.bottom }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={styles.headerActions}>
            <Pressable 
              style={styles.actionButton} 
              onPress={() => setShowConversationManager(true)}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#8B5CF6" />
            </Pressable>
            <Pressable 
              style={styles.actionButton} 
              onPress={() => setShowVoiceSelection(true)}
            >
              <Ionicons name="person" size={18} color="#007AFF" />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleWebSearch}>
              <Ionicons name="search" size={18} color="#3B82F6" />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleFileUpload}>
              <Ionicons name="document-attach" size={18} color="#10B981" />
            </Pressable>
            <Pressable
              style={[
                styles.voiceModeButton,
                isVoiceMode && styles.voiceModeButtonActive
              ]}
              onPress={toggleVoiceMode}
            >
              <Ionicons 
                name={isVoiceMode ? "mic" : "mic-outline"} 
                size={20} 
                color={isVoiceMode ? "#10B981" : "#6B7280"} 
              />
            </Pressable>
            <Pressable style={styles.clearButton} onPress={clearChat}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Voice Mode Indicator */}
        {isVoiceMode && (
          <View style={styles.voiceModeIndicator}>
            <Ionicons name="mic" size={16} color="#10B981" />
            <Text style={styles.voiceModeText}>Voice Mode Active</Text>
            <Pressable onPress={() => setShowVoiceUI(true)}>
              <Text style={styles.voiceModeAction}>Open Voice</Text>
            </Pressable>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={20}
          updateCellsBatchingPeriod={100}
          getItemLayout={undefined}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {/* Input Container */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isVoiceMode ? "Type or use voice..." : "Type your message..."}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            
            {/* Voice Button */}
            {voicePermissionGranted && (
              <Pressable
                style={[
                  styles.voiceButton,
                  isVoiceMode && styles.voiceButtonActive
                ]}
                onPress={toggleVoiceMode}
              >
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color={isVoiceMode ? "#10B981" : "#6B7280"} 
                />
              </Pressable>
            )}

            {/* Send Button */}
            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendTextMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons 
                name={isLoading ? "hourglass-outline" : "send"} 
                size={20} 
                color="white" 
              />
            </Pressable>
          </View>
        </View>

        {/* Voice Interaction UI */}
        <VoiceInteractionUI
          visible={showVoiceUI}
          onClose={() => {
            console.log('🎤 Closing voice UI');
            setShowVoiceUI(false);
          }}
          onTranscription={handleVoiceTranscription}
          onResponse={handleVoiceResponse}
        />

        <VoiceSelectionModal
          visible={showVoiceSelection}
          onClose={() => setShowVoiceSelection(false)}
          speechService={speechService}
          onVoiceSelected={(voice) => {
            console.log('🎯 Voice selected:', voice.name);
          }}
        />

        <ConversationManager
          visible={showConversationManager}
          onClose={() => setShowConversationManager(false)}
          onSelectConversation={(id) => {
            const { setCurrentConversation } = useChatStore.getState();
            setCurrentConversation(id);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  voiceModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  voiceModeButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  clearButton: {
    padding: 8,
  },
  voiceModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1FAE5',
    gap: 8,
  },
  voiceModeText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  voiceModeAction: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F59E0B',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#EF4444',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: 'white',
  },
  errorText: {
    color: 'white',
  },
  messageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voiceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  speakButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  speakButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  messageMetadata: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  processingTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: 'white',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  voiceButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});

export default VoiceEnhancedChatScreen;