import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { RagService } from '../services/RagService';

export const RagTab: React.FC = () => {
  const [ragService] = useState(() => RagService.getInstance());
  const [queryText, setQueryText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(ragService.getPreferredProvider());

  const askRAG = async () => {
    if (!queryText.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await ragService.answerWithRAG(queryText.trim());
      setResponse(result);
    } catch (error) {
      console.error('RAG query failed:', error);
      Alert.alert('Error', 'Failed to get RAG response');
      setResponse('Error: Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const switchProvider = () => {
    const providers: Array<'openai' | 'anthropic' | 'grok'> = ['openai', 'anthropic', 'grok'];
    const currentIndex = providers.indexOf(provider as any);
    const nextProvider = providers[(currentIndex + 1) % providers.length];
    
    ragService.setPreferredProvider(nextProvider);
    setProvider(nextProvider);
    Alert.alert('Provider Changed', `Now using ${nextProvider.toUpperCase()}`);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          RAG Assistant
        </Text>
        <Text className="text-gray-600 mb-2">
          Ask questions and get context-aware answers
        </Text>
        <Pressable
          className="bg-gray-200 rounded-lg p-2 self-start"
          onPress={switchProvider}
        >
          <Text className="text-sm text-gray-700">
            Provider: {provider.toUpperCase()} (tap to switch)
          </Text>
        </Pressable>
      </View>

      {/* Query Input */}
      <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Ask a Question
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-4 mb-4 min-h-[80px]"
          placeholder="What would you like to know? I'll search my memory and provide an informed answer..."
          value={queryText}
          onChangeText={setQueryText}
          multiline
          textAlignVertical="top"
        />
        <Pressable
          className={`rounded-lg p-4 ${
            isLoading || !queryText.trim()
              ? 'bg-gray-300'
              : 'bg-purple-500'
          }`}
          onPress={askRAG}
          disabled={isLoading || !queryText.trim()}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Thinking...' : 'Ask RAG'}
          </Text>
        </Pressable>
      </View>

      {/* Response */}
      {response && (
        <View className="bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            RAG Response
          </Text>
          <ScrollView className="max-h-96">
            <Text className="text-gray-800 leading-6">{response}</Text>
          </ScrollView>
        </View>
      )}

      {/* Sample Queries */}
      <View className="mt-6 p-4 bg-purple-50 rounded-lg">
        <Text className="text-sm text-purple-800 mb-2 font-semibold">
          Try these sample queries:
        </Text>
        <Text className="text-sm text-purple-700">
          • "What do you know about mobile development?"{'\n'}
          • "How can I implement semantic search?"{'\n'}
          • "Tell me about React Native best practices"{'\n'}
          • "What databases are good for mobile apps?"
        </Text>
      </View>
    </ScrollView>
  );
};