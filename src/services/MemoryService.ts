import * as SQLite from 'expo-sqlite';
import { EmbeddingService } from './EmbeddingService';

/**
 * Memory represents a stored piece of content with its metadata and vector embedding
 */
export interface Memory {
  id: number;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
  embedding?: number[];
}

/**
 * MemoryService provides persistent storage and semantic search capabilities for text content.
 * It uses Expo SQLite for storage and manual similarity calculation for vector search.
 */
export class MemoryService {
  private static instance: MemoryService | null = null;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  
  private constructor() {}
  
  /**
   * Gets the singleton instance of MemoryService
   */
  static getInstance(): MemoryService {
    if (!this.instance) {
      this.instance = new MemoryService();
    }
    return this.instance;
  }
  
  /**
   * Initializes the database connection and creates necessary tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Open the database
      this.db = await SQLite.openDatabaseAsync('assistant-memory.db');
      
      // Create the main memories table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          metadata TEXT,
          timestamp TEXT NOT NULL
        )
      `);
      
      // Create the embeddings table for vector storage
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS memory_embeddings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          memory_id INTEGER NOT NULL,
          embedding TEXT NOT NULL,
          FOREIGN KEY (memory_id) REFERENCES memories (id) ON DELETE CASCADE
        )
      `);
      
      // Create indexes for better performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp)
      `);
      
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_memory_embeddings_memory_id ON memory_embeddings(memory_id)
      `);
      
      this.initialized = true;
      console.log('MemoryService initialized successfully with Expo SQLite');
      
    } catch (error) {
      console.error('Failed to initialize MemoryService:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Adds a new memory with automatic embedding generation
   * @param text - The content to store
   * @param metadata - Optional metadata object to associate with the memory
   * @returns Promise<number> - The ID of the created memory
   */
  async addMemory(text: string, metadata?: Record<string, any>): Promise<number> {
    await this.ensureInitialized();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Memory content cannot be empty');
    }
    
    try {
      // Generate embedding for the text
      const embedding = await EmbeddingService.embed(text.trim());
      
      // Serialize metadata and embedding
      const metadataJson = metadata ? JSON.stringify(metadata) : null;
      const embeddingJson = JSON.stringify(embedding);
      const timestamp = new Date().toISOString();
      
      // Begin transaction manually
      await this.db!.execAsync('BEGIN TRANSACTION');
      
      try {
        // Insert the memory record
        const memoryResult = await this.db!.runAsync(
          'INSERT INTO memories (content, metadata, timestamp) VALUES (?, ?, ?)',
          [text.trim(), metadataJson, timestamp]
        );
        
        const memoryId = memoryResult.lastInsertRowId;
        if (!memoryId) {
          throw new Error('Failed to get memory ID after insertion');
        }
        
        // Insert the embedding
        await this.db!.runAsync(
          'INSERT INTO memory_embeddings (memory_id, embedding) VALUES (?, ?)',
          [memoryId, embeddingJson]
        );
        
        // Commit transaction
        await this.db!.execAsync('COMMIT');
        
        console.log(`Memory added successfully with ID: ${memoryId}`);
        return memoryId;
        
      } catch (error) {
        // Rollback on error
        await this.db!.execAsync('ROLLBACK');
        throw error;
      }
      
    } catch (error) {
      console.error('Failed to add memory:', error);
      throw new Error(`Failed to add memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Queries memories using semantic search
   * @param query - The search query text
   * @param k - Number of results to return (default: 5)
   * @returns Promise<string[]> - Array of matching memory contents
   */
  async queryMemory(query: string, k: number = 5): Promise<string[]> {
    await this.ensureInitialized();
    
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }
    
    if (k < 1) {
      throw new Error('k must be at least 1');
    }
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await EmbeddingService.embed(query.trim());
      
      // Get all memories with their embeddings
      const allMemories = await this.db!.getAllAsync(`
        SELECT 
          m.id,
          m.content,
          me.embedding
        FROM memories m
        JOIN memory_embeddings me ON m.id = me.memory_id
        ORDER BY m.timestamp DESC
      `);
      
      if (!allMemories || allMemories.length === 0) {
        return [];
      }
      
      // Calculate similarities
      const similarities: Array<{ content: string, similarity: number }> = [];
      
      for (const row of allMemories) {
        try {
          // Parse embedding from JSON
          const embeddingArray = JSON.parse((row as any).embedding as string) as number[];
          
          // Calculate cosine similarity
          const similarity = EmbeddingService.cosineSimilarity(queryEmbedding, embeddingArray);
          
          similarities.push({
            content: (row as any).content as string,
            similarity: similarity
          });
        } catch (error) {
          console.warn(`Failed to process embedding for memory ${(row as any).id}:`, error);
        }
      }
      
      // Sort by similarity and return top k
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, k).map(item => item.content);
      
    } catch (error) {
      console.error('Failed to query memories:', error);
      throw new Error(`Failed to query memories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Retrieves all memories with optional filtering
   * @param limit - Maximum number of memories to return
   * @param offset - Number of memories to skip
   * @returns Promise<Memory[]> - Array of memory objects
   */
  async getAllMemories(limit: number = 100, offset: number = 0): Promise<Memory[]> {
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.getAllAsync(`
        SELECT 
          m.id,
          m.content,
          m.metadata,
          m.timestamp
        FROM memories m
        ORDER BY m.timestamp DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      if (!result) {
        return [];
      }
      
      return result.map(row => ({
        id: (row as any).id as number,
        content: (row as any).content as string,
        metadata: (row as any).metadata ? JSON.parse((row as any).metadata as string) : undefined,
        timestamp: (row as any).timestamp as string
      }));
      
    } catch (error) {
      console.error('Failed to get all memories:', error);
      throw new Error(`Failed to retrieve memories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Deletes a memory by ID
   * @param memoryId - The ID of the memory to delete
   * @returns Promise<boolean> - True if deleted successfully
   */
  async deleteMemory(memoryId: number): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.runAsync(
        'DELETE FROM memories WHERE id = ?',
        [memoryId]
      );
      
      return result.changes > 0;
      
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw new Error(`Failed to delete memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Gets the total count of stored memories
   * @returns Promise<number> - The total number of memories
   */
  async getMemoryCount(): Promise<number> {
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.getFirstAsync('SELECT COUNT(*) as count FROM memories');
      return ((result as any)?.count as number) || 0;
      
    } catch (error) {
      console.error('Failed to get memory count:', error);
      throw new Error(`Failed to get memory count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Searches memories by content (text search fallback)
   * @param searchText - Text to search for
   * @param limit - Maximum results to return
   * @returns Promise<Memory[]> - Matching memories
   */
  async searchMemoriesByText(searchText: string, limit: number = 10): Promise<Memory[]> {
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.getAllAsync(`
        SELECT 
          m.id,
          m.content,
          m.metadata,
          m.timestamp
        FROM memories m
        WHERE m.content LIKE ?
        ORDER BY m.timestamp DESC
        LIMIT ?
      `, [`%${searchText}%`, limit]);
      
      if (!result) {
        return [];
      }
      
      return result.map(row => ({
        id: (row as any).id as number,
        content: (row as any).content as string,
        metadata: (row as any).metadata ? JSON.parse((row as any).metadata as string) : undefined,
        timestamp: (row as any).timestamp as string
      }));
      
    } catch (error) {
      console.error('Failed to search memories by text:', error);
      throw new Error(`Failed to search memories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Ensures the service is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}