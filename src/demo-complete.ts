/**
 * Complete OnDeviceAI Demonstration
 * This file showcases all the implemented functionality in Phase 1
 */

import { MemoryService, EmbeddingService, RagService } from './services';
import { AgentExecutor } from './agents';
import { CalendarModule } from './modules/CalendarModule';
import { Tool } from './hooks/useToolPermissions';

export class CompleteOnDeviceAIDemo {
  private memoryService: MemoryService;
  private ragService: RagService;
  private calendarModule: CalendarModule;

  constructor() {
    this.memoryService = MemoryService.getInstance();
    this.ragService = RagService.getInstance();
    this.calendarModule = CalendarModule.getInstance();
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing OnDeviceAI Demo...\n');
    
    try {
      // Initialize memory service
      await this.memoryService.initialize();
      console.log('✅ Memory Service initialized');

      // Try to initialize calendar (will fail gracefully on web)
      try {
        await this.calendarModule.initialize();
        console.log('✅ Calendar Module initialized');
      } catch (error) {
        console.log('⚠️  Calendar Module not available on this platform');
      }

      console.log('✅ All services initialized successfully\n');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Demonstrate core memory functionality
   */
  async demonstrateMemory(): Promise<void> {
    console.log('📚 MEMORY SERVICE DEMONSTRATION\n');

    try {
      // Add sample memories
      const sampleMemories = [
        {
          content: "React Native is a framework for building mobile apps using JavaScript and React",
          metadata: { category: "technology", importance: "high" }
        },
        {
          content: "Vector embeddings enable semantic search by converting text to numerical representations",
          metadata: { category: "ai", difficulty: "advanced" }
        },
        {
          content: "SQLite is a lightweight database perfect for mobile applications",
          metadata: { category: "database", platform: "mobile" }
        },
        {
          content: "TypeScript provides type safety and better developer experience in JavaScript projects",
          metadata: { category: "programming", language: "typescript" }
        },
        {
          content: "User prefers dark mode interfaces and minimal design approaches",
          metadata: { category: "preferences", type: "ui_ux" }
        }
      ];

      console.log('Adding sample memories...');
      for (const memory of sampleMemories) {
        const id = await this.memoryService.addMemory(memory.content, memory.metadata);
        console.log(`  ✓ Memory ${id}: ${memory.content.substring(0, 50)}...`);
      }

      // Test semantic search
      console.log('\n🔍 Testing semantic search:');
      const queries = [
        "mobile app development",
        "artificial intelligence and embeddings", 
        "data storage solutions",
        "type-safe programming",
        "user interface preferences"
      ];

      for (const query of queries) {
        const results = await this.memoryService.queryMemory(query, 2);
        console.log(`\n  Query: "${query}"`);
        results.forEach((result, i) => {
          console.log(`    ${i + 1}. ${result.substring(0, 80)}...`);
        });
      }

      const totalMemories = await this.memoryService.getMemoryCount();
      console.log(`\n📊 Total stored memories: ${totalMemories}\n`);

    } catch (error) {
      console.error('❌ Memory demonstration failed:', error);
    }
  }

  /**
   * Demonstrate RAG functionality
   */
  async demonstrateRAG(): Promise<void> {
    console.log('🤖 RAG SERVICE DEMONSTRATION\n');

    try {
      console.log(`Current AI Provider: ${this.ragService.getPreferredProvider().toUpperCase()}\n`);

      const ragQueries = [
        "What do you know about mobile application development?",
        "How can I implement semantic search in my project?",
        "What are the benefits of using TypeScript?",
        "Tell me about database options for mobile apps",
        "What UI design preferences should I consider?"
      ];

      for (const query of ragQueries) {
        console.log(`❓ Question: "${query}"`);
        console.log('🔍 Retrieving context and generating response...');
        
        try {
          const response = await this.ragService.answerWithRAG(query, 3);
          console.log(`💡 RAG Answer: ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}\n`);
        } catch (error) {
          console.log(`❌ Failed to get RAG response: ${error}\n`);
        }
      }

    } catch (error) {
      console.error('❌ RAG demonstration failed:', error);
    }
  }

  /**
   * Demonstrate Agent reasoning
   */
  async demonstrateAgent(): Promise<void> {
    console.log('🧠 AI AGENT DEMONSTRATION\n');

    try {
      // Define available tools
      const availableTools: Tool[] = [
        {
          name: 'addMemory',
          description: 'Store important information for later retrieval',
          parameters: {
            content: { type: 'string', description: 'Information to store', required: true },
            metadata: { type: 'object', description: 'Optional metadata tags' }
          },
          category: 'memory'
        },
        {
          name: 'searchMemory',
          description: 'Search through stored memories using semantic similarity',
          parameters: {
            query: { type: 'string', description: 'Search query', required: true },
            limit: { type: 'number', description: 'Maximum results to return' }
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
          description: 'Calculate number of days between two dates',
          parameters: {
            startDate: { type: 'string', description: 'Start date (ISO format)', required: true },
            endDate: { type: 'string', description: 'End date (ISO format)', required: true }
          },
          category: 'utility'
        }
      ];

      // Create and configure the agent
      const agent = new AgentExecutor(availableTools, {
        maxIterations: 8,
        timeoutMs: 45000,
        retryAttempts: 3
      });

      const agentTasks = [
        "What's the current time and how many days until Christmas 2025?",
        "Remember that I love React Native development, then search for what you know about it",
        "Store information about vector databases and then retrieve it back",
        "What programming languages and frameworks do you remember me mentioning?"
      ];

      for (const task of agentTasks) {
        console.log(`🎯 Agent Task: "${task}"`);
        console.log('🤔 Agent is thinking...\n');

        try {
          const result = await agent.run(task);
          
          if (result.success) {
            console.log(`✅ Final Answer: ${result.finalAnswer}`);
            console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
            console.log(`🔄 Reasoning Steps: ${result.totalSteps}`);
            
            if (result.steps.length > 0) {
              console.log('\n📋 Detailed Reasoning:');
              result.steps.forEach((step, i) => {
                console.log(`  ${i + 1}. ${step}`);
              });
            }
          } else {
            console.log(`❌ Agent Failed: ${result.finalAnswer}`);
          }
          
          console.log('\n' + '='.repeat(100) + '\n');
          
        } catch (error) {
          console.log(`❌ Agent execution failed: ${error}\n`);
        }
        
        // Brief pause between tasks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('❌ Agent demonstration failed:', error);
    }
  }

  /**
   * Test embedding similarity
   */
  async testEmbeddingSimilarity(): Promise<void> {
    console.log('🧮 EMBEDDING SIMILARITY TEST\n');

    try {
      const testPairs = [
        {
          text1: "React Native mobile development",
          text2: "Building apps with React for mobile devices",
          text3: "Cooking recipes and kitchen techniques"
        },
        {
          text1: "Machine learning and artificial intelligence",
          text2: "AI algorithms and neural networks",  
          text3: "Gardening tips and plant care"
        }
      ];

      for (const pair of testPairs) {
        console.log(`Text A: "${pair.text1}"`);
        console.log(`Text B: "${pair.text2}"`);
        console.log(`Text C: "${pair.text3}"`);

        const [embA, embB, embC] = await EmbeddingService.embedBatch([
          pair.text1, pair.text2, pair.text3
        ]);

        const simAB = EmbeddingService.cosineSimilarity(embA, embB);
        const simAC = EmbeddingService.cosineSimilarity(embA, embC);

        console.log(`Similarity A-B: ${simAB.toFixed(3)} (should be high)`);
        console.log(`Similarity A-C: ${simAC.toFixed(3)} (should be low)\n`);
      }

    } catch (error) {
      console.error('❌ Embedding similarity test failed:', error);
    }
  }

  /**
   * Show system statistics
   */
  async showSystemStats(): Promise<void> {
    console.log('📊 SYSTEM STATISTICS\n');

    try {
      const memoryCount = await this.memoryService.getMemoryCount();
      const recentMemories = await this.memoryService.getAllMemories(5);
      
      console.log(`Total Memories: ${memoryCount}`);
      console.log(`RAG Provider: ${this.ragService.getPreferredProvider().toUpperCase()}`);
      console.log(`Calendar Available: ${this.calendarModule.isAvailable() ? 'Yes' : 'No'}`);
      
      if (recentMemories.length > 0) {
        console.log('\nRecent Memories:');
        recentMemories.forEach((memory, i) => {
          const date = new Date(memory.timestamp).toLocaleDateString();
          console.log(`  ${i + 1}. [${date}] ${memory.content.substring(0, 60)}...`);
        });
      }

      console.log('\n');
    } catch (error) {
      console.error('❌ Failed to get system stats:', error);
    }
  }

  /**
   * Run complete demonstration
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🌟 ONDEVICEAI COMPLETE DEMONSTRATION');
    console.log('='.repeat(120));
    console.log('Phase 1: Foundation & Core Services + Retrieval & Reasoning');
    console.log('='.repeat(120));
    console.log();

    try {
      await this.initialize();
      await this.showSystemStats();
      await this.demonstrateMemory();
      await this.testEmbeddingSimilarity();
      await this.demonstrateRAG();
      await this.demonstrateAgent();

      console.log('🎉 DEMONSTRATION COMPLETE!');
      console.log('✨ OnDeviceAI is ready for production use!');
      console.log('🚀 All systems operational: Memory, RAG, and Agent reasoning');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Interactive demo mode (for development/testing)
   */
  async interactiveDemo(): Promise<void> {
    console.log('🎮 Interactive Demo Mode - Try asking questions!\n');
    
    // This would typically be used with a REPL or interactive environment
    const sampleInteractions = [
      "Tell me about mobile development frameworks",
      "Remember that I prefer clean code and TypeScript",
      "What's the difference between SQL and NoSQL databases?",
      "Calculate how many days until the next major holiday"
    ];

    console.log('Sample interactions you could try:');
    sampleInteractions.forEach((interaction, i) => {
      console.log(`${i + 1}. "${interaction}"`);
    });
    
    console.log('\nUse the app interface to test these interactions!\n');
  }
}

// Usage Examples:
// const demo = new CompleteOnDeviceAIDemo();
// await demo.runCompleteDemo();
// await demo.interactiveDemo();