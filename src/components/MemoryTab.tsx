import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { MemoryService } from '../services/MemoryService';

export const MemoryTab: React.FC = () => {
  const [memoryService, setMemoryService] = useState<MemoryService | null>(null);
  const [inputText, setInputText] = useState('');
  const [queryText, setQueryText] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    initializeMemoryService();
  }, []);

  const initializeMemoryService = async () => {
    try {
      const service = MemoryService.getInstance();
      await service.initialize();
      setMemoryService(service);
      const count = await service.getMemoryCount();
      setMemoryCount(count);
    } catch (error) {
      console.error('Failed to initialize MemoryService:', error);
      Alert.alert('Error', 'Failed to initialize memory service');
    }
  };

  const addMemory = async () => {
    if (!memoryService || !inputText.trim()) return;
    
    setIsLoading(true);
    try {
      await memoryService.addMemory(inputText.trim(), {
        source: 'user_input',
        timestamp: new Date().toISOString()
      });
      setInputText('');
      const count = await memoryService.getMemoryCount();
      setMemoryCount(count);
      Alert.alert('Success', 'Memory added successfully!');
    } catch (error) {
      console.error('Failed to add memory:', error);
      Alert.alert('Error', 'Failed to add memory');
    } finally {
      setIsLoading(false);
    }
  };

  const searchMemories = async () => {
    if (!memoryService || !queryText.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await memoryService.queryMemory(queryText.trim(), 5);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search memories:', error);
      Alert.alert('Error', 'Failed to search memories');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Memory Storage
        </Text>
        <Text className="text-gray-600 mb-2">
          Store and search your memories semantically
        </Text>
        <Text className="text-sm text-gray-500">
          Stored memories: {memoryCount}
        </Text>
      </View>

      {/* Add Memory Section */}
      <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Add Memory
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-4 mb-4 min-h-[100px]"
          placeholder="Enter text to remember..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
        />
        <Pressable
          className={`rounded-lg p-4 ${
            isLoading || !inputText.trim()
              ? 'bg-gray-300'
              : 'bg-blue-500'
          }`}
          onPress={addMemory}
          disabled={isLoading || !inputText.trim()}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Adding...' : 'Add Memory'}
          </Text>
        </Pressable>
      </View>

      {/* Search Section */}
      <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Search Memories
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-4 mb-4"
          placeholder="What would you like to find?"
          value={queryText}
          onChangeText={setQueryText}
        />
        <Pressable
          className={`rounded-lg p-4 ${
            isLoading || !queryText.trim()
              ? 'bg-gray-300'
              : 'bg-green-500'
          }`}
          onPress={searchMemories}
          disabled={isLoading || !queryText.trim()}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Searching...' : 'Search'}
          </Text>
        </Pressable>
      </View>

      {/* Results Section */}
      {searchResults.length > 0 && (
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Search Results
          </Text>
          {searchResults.map((result, index) => (
            <View key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <Text className="text-gray-800">{result}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Info Section */}
      <View className="p-4 bg-blue-50 rounded-lg">
        <Text className="text-sm text-blue-800 mb-2 font-semibold">
          How it works:
        </Text>
        <Text className="text-sm text-blue-700">
          • Add memories using natural language{'\n'}
          • Search semantically - find related content{'\n'}
          • Powered by OpenAI embeddings{'\n'}
          • All data stored locally on device
        </Text>
      </View>
    </ScrollView>
  );
};