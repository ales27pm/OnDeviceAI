import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, AgentStatus, StreamingState, ChatPerformanceMetrics } from '../types/chat';
import { StreamingAgentExecutor } from '../agents/AgentExecutorWithStatus';
import { useToolPermissions } from '../hooks/useToolPermissions';
import { usePerformanceLogger } from '../hooks/usePerformanceLogger';

/**
 * Message bubble component with performance optimizations
 */
const MessageBubble = React.memo<{
  message: ChatMessage;
  isLastMessage: boolean;
}>(({ message, isLastMessage }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const hasError = message.status === 'error';

  // Animated typing indicator for streaming messages
  const typingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStreaming) {
      // Create blinking animation for typing indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingOpacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingOpacity.setValue(1);
    }
  }, [isStreaming, typingOpacity]);

  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.botMessageContainer,
      isLastMessage && styles.lastMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble,
        hasError && styles.errorBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText,
          hasError && styles.errorText
        ]}>
          {message.content}
        </Text>
        
        {isStreaming && (
          <Animated.View style={[styles.typingIndicator, { opacity: typingOpacity }]}>
            <Text style={styles.typingText}>●</Text>
          </Animated.View>
        )}
        
        {hasError && message.metadata?.error && (
          <Text style={styles.errorDetails}>
            {message.metadata.error}
          </Text>
        )}
      </View>
      
      {/* Metadata for bot messages */}
      {!isUser && message.metadata && (
        <View style={styles.messageMetadata}>
          {message.metadata.processingTime && (
            <Text style={styles.metadataText}>
              {message.metadata.processingTime}ms
            </Text>
          )}
          {message.metadata.tokenCount && (
            <Text style={styles.metadataText}>
              {message.metadata.tokenCount} tokens
            </Text>
          )}
          {message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0 && (
            <Text style={styles.metadataText}>
              Tools: {message.metadata.toolsUsed.join(', ')}
            </Text>
          )}
        </View>
      )}
      
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );
});

/**
 * Status bar component showing agent activity
 */
const StatusBar = React.memo<{
  agentStatus: AgentStatus;
  isVisible: boolean;
}>(({ agentStatus, isVisible }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    if (agentStatus.toolsInUse.length > 0) {
      return 'construct-outline';
    }
    if (agentStatus.isThinking) {
      return 'hardware-chip-outline';
    }
    return 'time-outline';
  };

  return (
    <Animated.View style={[
      styles.statusBar,
      {
        opacity: slideAnim,
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0],
          }),
        }],
      }
    ]}>
      <Ionicons 
        name={getStatusIcon()} 
        size={16} 
        color="#6B7280" 
        style={styles.statusIcon}
      />
      <Text style={styles.statusText}>
        {agentStatus.currentAction || 'Thinking...'}
      </Text>
      
      {agentStatus.progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressBar,
            { width: `${Math.round(agentStatus.progress * 100)}%` }
          ]} />
        </View>
      )}
      
      {agentStatus.toolsInUse.length > 0 && (
        <View style={styles.toolsContainer}>
          {agentStatus.toolsInUse.map((tool, index) => (
            <Text key={index} style={styles.toolTag}>
              {tool}
            </Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
});

/**
 * Main Chat Screen component
 */
export const ChatScreen: React.FC = () => {
  // Hooks
  const insets = useSafeAreaInsets();
  const { availableTools, isLoading: toolsLoading } = useToolPermissions();
  const performanceLogger = usePerformanceLogger();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isThinking: false,
    currentAction: null,
    toolsInUse: [],
    step: null,
    progress: 0
  });
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    buffer: '',
    tokenCount: 0,
    startTime: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<ChatPerformanceMetrics | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const agentRef = useRef<StreamingAgentExecutor | null>(null);
  const streamingBufferRef = useRef<string>('');
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const firstTokenTimeRef = useRef<number | null>(null);

  // Initialize agent
  useEffect(() => {
    if (!toolsLoading && availableTools.length > 0) {
      const agent = new StreamingAgentExecutor(availableTools, {
        maxIterations: 8,
        timeoutMs: 60000,
        retryAttempts: 2
      });

      // Set up status callback
      agent.setStatusCallback((status) => {
        setAgentStatus(prev => ({ ...prev, ...status }));
      });

      // Set up token streaming callback
      agent.setTokenCallback((token) => {
        // Record time to first token
        if (!firstTokenTimeRef.current) {
          firstTokenTimeRef.current = Date.now();
          const tft = firstTokenTimeRef.current - streamingState.startTime;
          performanceLogger.logTFT(tft);
        }

        // Add token to buffer
        streamingBufferRef.current += token;
        setStreamingState(prev => ({
          ...prev,
          buffer: streamingBufferRef.current,
          tokenCount: prev.tokenCount + 1
        }));
      });

      agentRef.current = agent;
    }
  }, [availableTools, toolsLoading, performanceLogger, streamingState.startTime]);

  // Flush streaming buffer every 100ms
  useEffect(() => {
    if (streamingState.isStreaming && currentMessageIdRef.current) {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }

      flushIntervalRef.current = setInterval(() => {
        const buffer = streamingBufferRef.current;
        if (buffer) {
          setMessages(prev => prev.map(msg => 
            msg.id === currentMessageIdRef.current
              ? { ...msg, content: buffer, status: 'streaming' as const }
              : msg
          ));
        }
      }, 100);

      return () => {
        if (flushIntervalRef.current) {
          clearInterval(flushIntervalRef.current);
          flushIntervalRef.current = null;
        }
      };
    }
  }, [streamingState.isStreaming]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Memoized message renderer for performance
  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => (
    <MessageBubble 
      message={item} 
      isLastMessage={index === messages.length - 1}
    />
  ), [messages.length]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Send message handler
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !agentRef.current || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Start performance tracking
    performanceLogger.startTiming('agent-response');
    performanceLogger.logMemory();

    // Initialize streaming state
    const startTime = Date.now();
    firstTokenTimeRef.current = null;
    streamingBufferRef.current = '';
    setStreamingState({
      isStreaming: true,
      buffer: '',
      tokenCount: 0,
      startTime
    });

    // Create bot message for streaming
    const botMessageId = (Date.now() + 1).toString();
    currentMessageIdRef.current = botMessageId;
    
    const botMessage: ChatMessage = {
      id: botMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      status: 'streaming'
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      // Run agent
      const result = await agentRef.current.run(inputText.trim());
      
      // Calculate performance metrics
      const processingTime = performanceLogger.endTiming('agent-response');
      const totalTokens = streamingState.tokenCount;
      const tps = totalTokens > 0 ? (totalTokens / processingTime) * 1000 : 0;
      
      if (totalTokens > 0) {
        performanceLogger.logTPS(totalTokens, processingTime);
      }

      // Update final message
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId
          ? {
              ...msg,
              content: result.finalAnswer,
              status: 'sent' as const,
              metadata: {
                processingTime,
                tokenCount: totalTokens,
                reasoningSteps: result.steps,
                toolsUsed: agentStatus.toolsInUse
              }
            }
          : msg
      ));

      // Update performance metrics
      setPerformanceMetrics({
        timeToFirstToken: firstTokenTimeRef.current ? firstTokenTimeRef.current - startTime : 0,
        tokensPerSecond: tps,
        totalTokens,
        processingTime,
        memoryUsage: 0 // Will be updated by memory logging
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Update message with error
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId
          ? {
              ...msg,
              content: 'I encountered an error while processing your request.',
              status: 'error' as const,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          : msg
      ));

      Alert.alert('Error', 'Failed to process your message. Please try again.');
    } finally {
      setIsLoading(false);
      setStreamingState(prev => ({ ...prev, isStreaming: false }));
      currentMessageIdRef.current = null;
      
      // Final memory check
      performanceLogger.logMemory();
    }
  }, [inputText, isLoading, agentStatus.toolsInUse, performanceLogger, streamingState.tokenCount]);

  // Clear chat handler
  const clearChat = useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            performanceLogger.clearMetrics();
            setPerformanceMetrics(null);
          }
        }
      ]
    );
  }, [performanceLogger]);

  // Memoized styles
  const dynamicStyles = useMemo(() => ({
    container: [styles.container, { paddingBottom: insets.bottom }],
    inputContainer: [styles.inputContainer, { paddingBottom: insets.bottom }]
  }), [insets.bottom]);

  const isStatusVisible = agentStatus.isThinking || streamingState.isStreaming;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={styles.headerActions}>
            {performanceMetrics && (
              <Pressable
                style={styles.metricsButton}
                onPress={() => {
                  Alert.alert(
                    'Performance Metrics',
                    `TFT: ${performanceMetrics.timeToFirstToken}ms\n` +
                    `TPS: ${performanceMetrics.tokensPerSecond.toFixed(2)}\n` +
                    `Tokens: ${performanceMetrics.totalTokens}\n` +
                    `Processing: ${performanceMetrics.processingTime}ms`
                  );
                }}
              >
                <Ionicons name="speedometer-outline" size={20} color="#6B7280" />
              </Pressable>
            )}
            <Pressable style={styles.clearButton} onPress={clearChat}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted={false}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 100, // Estimated item height
            offset: 100 * index,
            index,
          })}
        />

        {/* Status Bar */}
        <StatusBar
          agentStatus={agentStatus}
          isVisible={isStatusVisible}
        />

        {/* Input */}
        <View style={dynamicStyles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
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
    gap: 12,
  },
  metricsButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
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
  lastMessage: {
    marginBottom: 16,
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
  typingIndicator: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
  },
  errorDetails: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  messageMetadata: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataText: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  toolsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  toolTag: {
    fontSize: 10,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    gap: 12,
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

export default ChatScreen;