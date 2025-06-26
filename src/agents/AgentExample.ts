/**
 * Example usage of AgentExecutor and RagService
 * This file demonstrates how to use the intelligent agent system
 */

import { AgentExecutor } from './AgentExecutor';
import { RagService } from '../services/RagService';
import { MemoryService } from '../services/MemoryService';
import { Tool } from '../hooks/useToolPermissions';

export class AgentExample {
  private ragService: RagService;
  private memoryService: MemoryService;

  constructor() {
    this.ragService = RagService.getInstance();
    this.memoryService = MemoryService.getInstance();
  }

  /**
   * Demonstrate RAG (Retrieval-Augmented Generation) functionality
   */
  async demonstrateRAG(): Promise<void> {
    console.log('🤖 RAG Service Demonstration\n');

    try {
      // Initialize services
      await this.memoryService.initialize();

      // Add some sample memories for context
      console.log('📝 Adding sample memories...');
      const sampleMemories = [
        "React Native is a popular framework for building cross-platform mobile applications using JavaScript and React",
        "SQLite is a lightweight, embedded database that's perfect for mobile applications",
        "Vector embeddings allow for semantic search by converting text into numerical representations",
        "The user prefers using TypeScript for better type safety in React Native projects",
        "Machine learning models like OpenAI's GPT can generate human-like text responses"
      ];

      for (const memory of sampleMemories) {
        await this.memoryService.addMemory(memory, { 
          category: 'technical_knowledge',
          source: 'demo' 
        });
      }

      // Test RAG queries
      const queries = [
        "What do you know about mobile app development?",
        "How can I implement semantic search?",
        "What are the benefits of using TypeScript?",
        "Tell me about databases for mobile apps"
      ];

      for (const query of queries) {
        console.log(`\n❓ Query: "${query}"`);
        console.log('🔍 Searching for relevant context...');
        
        const response = await this.ragService.answerWithRAG(query);
        console.log(`💡 Response: ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`);
      }

    } catch (error) {
      console.error('❌ RAG demonstration failed:', error);
    }
  }

  /**
   * Demonstrate Agent reasoning capabilities
   */
  async demonstrateAgent(): Promise<void> {
    console.log('\n🤯 Agent Executor Demonstration\n');

    try {
      // Define available tools for the agent
      const availableTools: Tool[] = [
        {
          name: 'addMemory',
          description: 'Store important information in memory',
          parameters: {
            content: { type: 'string', description: 'Information to store', required: true },
            metadata: { type: 'object', description: 'Optional metadata' }
          },
          category: 'memory'
        },
        {
          name: 'searchMemory', 
          description: 'Search through stored memories',
          parameters: {
            query: { type: 'string', description: 'Search query', required: true },
            limit: { type: 'number', description: 'Max results' }
          },
          category: 'memory'
        },
        {
          name: 'getCurrentTime',
          description: 'Get current date and time',
          parameters: {},
          category: 'system'
        },
        {
          name: 'calculateDaysBetween',
          description: 'Calculate days between two dates',
          parameters: {
            startDate: { type: 'string', description: 'Start date (ISO)', required: true },
            endDate: { type: 'string', description: 'End date (ISO)', required: true }
          },
          category: 'utility'
        }
      ];

      // Create agent executor
      const agent = new AgentExecutor(availableTools, {
        maxIterations: 5,
        timeoutMs: 30000,
        retryAttempts: 2
      });

      // Test queries that require reasoning and tool usage
      const agentQueries = [
        "Remember that I prefer React Native for mobile development, then tell me what you know about it",
        "What's the current time and how many days until Christmas?",
        "Store information about vector databases and then search for it",
        "What do you remember about mobile development frameworks?"
      ];

      for (const query of agentQueries) {
        console.log(`\n🎯 Agent Query: "${query}"`);
        console.log('🧠 Agent thinking...\n');

        const result = await agent.run(query);

        if (result.success) {
          console.log(`✅ Final Answer: ${result.finalAnswer}`);
          console.log(`⏱️  Execution time: ${result.executionTime}ms`);
          console.log(`🔄 Total steps: ${result.totalSteps}`);
          
          if (result.steps.length > 0) {
            console.log('\n📋 Reasoning Steps:');
            result.steps.forEach((step, index) => {
              console.log(`${index + 1}. ${step}`);
            });
          }
        } else {
          console.log(`❌ Agent failed: ${result.finalAnswer}`);
        }

        console.log('\n' + '='.repeat(80));
      }

    } catch (error) {
      console.error('❌ Agent demonstration failed:', error);
    }
  }

  /**
   * Test RAG with custom system prompts
   */
  async testCustomPrompts(): Promise<void> {
    console.log('\n🎨 Custom Prompt RAG Testing\n');

    try {
      const customPrompts = [
        {
          system: "You are a helpful coding assistant who specializes in React Native development.",
          query: "How do I implement navigation in my app?",
          useContext: true
        },
        {
          system: "You are a database expert who provides clear, practical advice.",
          query: "What's the best way to store user data locally?",
          useContext: true
        },
        {
          system: "You are a UI/UX consultant focused on mobile app design.",
          query: "What are some best practices for mobile interfaces?",
          useContext: false
        }
      ];

      for (const test of customPrompts) {
        console.log(`\n🎭 System Role: ${test.system.substring(0, 50)}...`);
        console.log(`❓ Query: "${test.query}"`);
        console.log(`🔍 Using context: ${test.useContext ? 'Yes' : 'No'}`);

        const response = await this.ragService.answerWithCustomPrompt(
          test.query,
          test.system,
          test.useContext
        );

        console.log(`💡 Response: ${response.substring(0, 300)}${response.length > 300 ? '...' : ''}`);
      }

    } catch (error) {
      console.error('❌ Custom prompt testing failed:', error);
    }
  }

  /**
   * Show RAG service configuration
   */
  async showConfiguration(): Promise<void> {
    console.log('\n⚙️  RAG Service Configuration\n');

    try {
      console.log(`🤖 Preferred AI Provider: ${this.ragService.getPreferredProvider()}`);
      
      const memoryCount = await this.memoryService.getMemoryCount();
      console.log(`💾 Stored Memories: ${memoryCount}`);

      // Test RAG functionality
      const testResult = await this.ragService.testRAG();
      console.log(`\n📊 RAG Test Results:`);
      console.log(`Query: "${testResult.query}"`);
      console.log(`Contexts Found: ${testResult.contexts.length}`);
      console.log(`Response Length: ${testResult.response.length} characters`);

    } catch (error) {
      console.error('❌ Configuration display failed:', error);
    }
  }

  /**
   * Run complete demonstration
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 Starting Complete OnDeviceAI Agent & RAG Demo\n');
    console.log('='.repeat(80));

    await this.showConfiguration();
    await this.demonstrateRAG();
    await this.testCustomPrompts();
    await this.demonstrateAgent();

    console.log('\n✨ Complete demonstration finished!');
    console.log('🎉 OnDeviceAI Agent system is ready for use!');
  }
}

// Usage example:
// const demo = new AgentExample();
// demo.runCompleteDemo().catch(console.error);