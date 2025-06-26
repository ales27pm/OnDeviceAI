/**
 * Example usage of MemoryService and EmbeddingService
 * This file demonstrates how to use the AI memory system
 */

import { MemoryService, EmbeddingService } from './index';

export class AIMemoryExample {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = MemoryService.getInstance();
  }

  /**
   * Initialize the memory system
   */
  async initialize() {
    try {
      await this.memoryService.initialize();
      console.log('✅ Memory system initialized with Expo SQLite');
    } catch (error) {
      console.error('❌ Failed to initialize memory system:', error);
      throw error;
    }
  }

  /**
   * Add various types of memories
   */
  async addSampleMemories() {
    try {
      // Add different types of content
      const memories = [
        {
          content: "The user prefers dark mode interfaces and minimal design",
          metadata: { category: "user_preference", importance: "high" }
        },
        {
          content: "Machine learning models work best with clean, normalized data",
          metadata: { category: "technical_knowledge", source: "documentation" }
        },
        {
          content: "The project deadline is next Friday, need to prioritize core features",
          metadata: { category: "project_info", urgency: "high", due_date: "2025-01-25" }
        },
        {
          content: "React Native performance tips: use FlatList for large datasets",
          metadata: { category: "development_tips", technology: "react-native" }
        },
        {
          content: "User reported bug in the search functionality on iOS devices",
          metadata: { category: "bug_report", platform: "ios", status: "open" }
        }
      ];

      for (const memory of memories) {
        const id = await this.memoryService.addMemory(memory.content, memory.metadata);
        console.log(`✅ Added memory ${id}: ${memory.content.substring(0, 50)}...`);
      }

    } catch (error) {
      console.error('❌ Failed to add sample memories:', error);
    }
  }

  /**
   * Demonstrate semantic search capabilities
   */
  async demonstrateSearch() {
    try {
      console.log('\n🔍 Demonstrating semantic search:');
      
      const queries = [
        "user interface preferences",
        "data preprocessing for AI",
        "upcoming project milestones", 
        "mobile app performance optimization",
        "iOS issues and problems"
      ];

      for (const query of queries) {
        console.log(`\nQuery: "${query}"`);
        const results = await this.memoryService.queryMemory(query, 2);
        
        if (results.length > 0) {
          results.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.substring(0, 80)}...`);
          });
        } else {
          console.log('  No relevant memories found');
        }
      }

    } catch (error) {
      console.error('❌ Search demonstration failed:', error);
    }
  }

  /**
   * Show memory statistics
   */
  async showStats() {
    try {
      const count = await this.memoryService.getMemoryCount();
      const allMemories = await this.memoryService.getAllMemories(10);
      
      console.log(`\n📊 Memory Statistics:`);
      console.log(`Total memories: ${count}`);
      console.log(`Recent memories:`);
      
      allMemories.forEach((memory, index) => {
        const date = new Date(memory.timestamp).toLocaleDateString();
        console.log(`  ${index + 1}. [${date}] ${memory.content.substring(0, 60)}...`);
      });

    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
    }
  }

  /**
   * Test embedding similarity
   */
  async testEmbeddingSimilarity() {
    try {
      console.log('\n🧮 Testing embedding similarity:');
      
      const text1 = "I love programming in React Native";
      const text2 = "Mobile development with React is enjoyable";
      const text3 = "I prefer cooking over coding";
      
      const embedding1 = await EmbeddingService.embed(text1);
      const embedding2 = await EmbeddingService.embed(text2);
      const embedding3 = await EmbeddingService.embed(text3);
      
      const similarity12 = EmbeddingService.cosineSimilarity(embedding1, embedding2);
      const similarity13 = EmbeddingService.cosineSimilarity(embedding1, embedding3);
      
      console.log(`Text 1: "${text1}"`);
      console.log(`Text 2: "${text2}"`);
      console.log(`Text 3: "${text3}"`);
      console.log(`Similarity 1-2: ${similarity12.toFixed(3)} (should be high)`);
      console.log(`Similarity 1-3: ${similarity13.toFixed(3)} (should be low)`);
      
    } catch (error) {
      console.error('❌ Embedding similarity test failed:', error);
    }
  }

  /**
   * Run complete demonstration
   */
  async runDemo() {
    console.log('🚀 Starting OnDeviceAI Memory System Demo');
    
    await this.initialize();
    await this.addSampleMemories();
    await this.demonstrateSearch();
    await this.showStats();
    await this.testEmbeddingSimilarity();
    
    console.log('\n✨ Demo completed successfully!');
  }
}

// Usage example:
// const demo = new AIMemoryExample();
// demo.runDemo().catch(console.error);