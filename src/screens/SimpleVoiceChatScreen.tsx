import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { SimpleSpeechService } from '../services/SimpleSpeechService';
import { RagService } from '../services/RagService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
}

export const SimpleVoiceChatScreen: React.FC = () => {
  // Services
  const [speechService] = useState(() => SimpleSpeechService.getInstance());
  const [ragService] = useState(() => RagService.getInstance());
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation
  const pulseValue = useSharedValue(1);
  const insets = useSafeAreaInsets();

  // Initialize services
  useEffect(() => {
    initializeServices();
  }, []);

  // Pulse animation for speaking indicator
  useEffect(() => {
    if (isSpeaking) {
      pulseValue.value = withRepeat(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 300 });
    }
  }, [isSpeaking, pulseValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const initializeServices = async () => {
    try {
      console.log('🚀 Initializing chat services...');
      
      await speechService.initialize();
      await ragService.initialize();
      
      setIsInitialized(true);
      
      // Welcome message
      addMessage('Hello! I\'m your AI assistant. You can type messages or use voice commands. Tap the speaker icon to hear responses aloud.', false);
      
      console.log('✅ Chat services initialized');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      Alert.alert('Initialization Error', 'Failed to initialize chat services. Some features may not work properly.');
    }
  };

  const addMessage = (text: string, isUser: boolean, isVoice: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      isVoice,
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    addMessage(text, true);
    setIsLoading(true);

    try {
      console.log('🤖 Processing message:', text);
      
      // Get AI response
      const response = await ragService.answerWithCustomPrompt(text, '', false);
      
      if (response) {
        addMessage(response, false);
      } else {
        addMessage('I apologize, but I couldn\'t generate a response. Please try again.', false);
      }
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      addMessage('I encountered an error processing your message. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = async (message: Message) => {
    if (isSpeaking) {
      await speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      
      await speechService.speak(message.text, {
        onDone: () => {
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
          Alert.alert('Speech Error', 'Failed to speak the message. Please try again.');
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to speak message:', error);
      setIsSpeaking(false);
      Alert.alert('Speech Error', 'Failed to speak the message.');
    }
  };

  const handleVoiceInput = () => {
    // For now, show a simple prompt for voice input
    // In a full implementation, this would use speech recognition
    Alert.prompt(
      'Voice Input',
      'Speech recognition is not fully implemented yet. Please enter your message:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: (text) => {
            if (text?.trim()) {
              addMessage(text.trim(), true, true);
              handleSendMessage(text.trim());
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.aiText
        ]}>
          {message.text}
        </Text>
        
        {message.isVoice && (
          <View style={styles.voiceIndicator}>
            <Ionicons name="mic" size={12} color={message.isUser ? '#fff' : '#666'} />
          </View>
        )}
      </View>
      
      {!message.isUser && (
        <Pressable 
          style={styles.speakButton}
          onPress={() => handleSpeakMessage(message)}
          disabled={!isInitialized}
        >
          <Animated.View style={animatedStyle}>
            <Ionicons 
              name={isSpeaking ? "volume-high" : "volume-medium"} 
              size={20} 
              color="#666" 
            />
          </Animated.View>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voice Chat Assistant</Text>
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.speakingText}>Speaking...</Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.inputRow}>
            <Pressable 
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              disabled={!isInitialized || isLoading}
            >
              <Ionicons name="mic" size={24} color={isInitialized ? "#007AFF" : "#CCC"} />
            </Pressable>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
              editable={isInitialized && !isLoading}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            
            <Pressable 
              style={[
                styles.sendButton,
                (!inputText.trim() || !isInitialized || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || !isInitialized || isLoading}
            >
              <Ionicons name="send" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakingText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#1a1a1a',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  voiceIndicator: {
    position: 'absolute',
    top: 4,
    right: 8,
  },
  speakButton: {
    padding: 8,
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
    fontSize: 16,
    color: '#1a1a1a',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});

export default SimpleVoiceChatScreen;