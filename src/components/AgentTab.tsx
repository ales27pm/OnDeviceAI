import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { AgentExecutor } from '../agents/AgentExecutor';
import { useToolPermissions } from '../hooks/useToolPermissions';

export const AgentTab: React.FC = () => {
  const { availableTools, isLoading: toolsLoading, getToolDescriptionsForPrompt } = useToolPermissions();
  const [agent, setAgent] = useState<AgentExecutor | null>(null);
  const [queryText, setQueryText] = useState('');
  const [response, setResponse] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (!toolsLoading && availableTools.length > 0) {
      const newAgent = new AgentExecutor(availableTools, {
        maxIterations: 5,
        timeoutMs: 45000,
        retryAttempts: 2
      });
      setAgent(newAgent);
    }
  }, [availableTools, toolsLoading]);

  const runAgent = async () => {
    if (!agent || !queryText.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    setSteps([]);
    
    try {
      const result = await agent.run(queryText.trim());
      
      if (result.success) {
        setResponse(result.finalAnswer);
        setSteps(result.steps);
      } else {
        setResponse(result.finalAnswer);
        Alert.alert('Agent Error', 'The agent encountered an issue');
      }
    } catch (error) {
      console.error('Agent execution failed:', error);
      Alert.alert('Error', 'Agent execution failed');
      setResponse('Error: Agent execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    "Remember that I prefer TypeScript, then tell me about its benefits",
    "What's the current time and calculate days until New Year?",
    "Store information about vector databases and search for it",
    "What do you remember about mobile development?"
  ];

  const selectSampleQuery = (query: string) => {
    setQueryText(query);
  };

  if (toolsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading agent tools...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          AI Agent
        </Text>
        <Text className="text-gray-600 mb-2">
          Intelligent reasoning with tool usage
        </Text>
        <Text className="text-sm text-gray-500">
          Available tools: {availableTools.length}
        </Text>
      </View>

      {/* Tools Info */}
      <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <Text className="text-md font-semibold text-gray-900 mb-2">
          Available Tools
        </Text>
        <ScrollView className="max-h-32">
          {availableTools.map((tool, index) => (
            <Text key={index} className="text-sm text-gray-600 mb-1">
              • {tool.name}: {tool.description}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Query Input */}
      <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Agent Task
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-4 mb-4 min-h-[80px]"
          placeholder="Give me a task that requires thinking and using tools..."
          value={queryText}
          onChangeText={setQueryText}
          multiline
          textAlignVertical="top"
        />
        <Pressable
          className={`rounded-lg p-4 ${
            isLoading || !queryText.trim() || !agent
              ? 'bg-gray-300'
              : 'bg-indigo-500'
          }`}
          onPress={runAgent}
          disabled={isLoading || !queryText.trim() || !agent}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Agent Thinking...' : 'Run Agent'}
          </Text>
        </Pressable>
      </View>

      {/* Sample Queries */}
      <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <Text className="text-md font-semibold text-gray-900 mb-3">
          Try These Examples
        </Text>
        <View className="space-y-2">
          {sampleQueries.map((query, index) => (
            <Pressable
              key={index}
              className="bg-gray-100 rounded-lg p-3"
              onPress={() => selectSampleQuery(query)}
            >
              <Text className="text-sm text-gray-700">{query}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Response */}
      {response && (
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Agent Response
            </Text>
            {steps.length > 0 && (
              <Pressable
                className="bg-gray-200 rounded-lg px-3 py-1"
                onPress={() => setShowSteps(!showSteps)}
              >
                <Text className="text-sm text-gray-700">
                  {showSteps ? 'Hide' : 'Show'} Steps
                </Text>
              </Pressable>
            )}
          </View>
          <ScrollView className="max-h-96">
            <Text className="text-gray-800 leading-6">{response}</Text>
          </ScrollView>
        </View>
      )}

      {/* Reasoning Steps */}
      {showSteps && steps.length > 0 && (
        <View className="bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Reasoning Steps
          </Text>
          <ScrollView className="max-h-96">
            {steps.map((step, index) => (
              <View key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                <Text className="text-sm text-gray-800">{step}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Info */}
      <View className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <Text className="text-sm text-indigo-800 mb-2 font-semibold">
          How the Agent works:
        </Text>
        <Text className="text-sm text-indigo-700">
          • Thinks step by step about your request{'\n'}
          • Uses available tools when needed{'\n'}
          • Remembers information across conversations{'\n'}
          • Provides reasoned, context-aware responses
        </Text>
      </View>
    </ScrollView>
  );
};