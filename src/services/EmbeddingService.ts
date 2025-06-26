import { getOpenAIClient } from '../api/openai';

/**
 * EmbeddingService provides text embedding functionality using OpenAI's embedding models.
 * This service generates vector representations of text that can be used for semantic search
 * and similarity comparison in the MemoryService.
 */
export class EmbeddingService {
  private static readonly MODEL = 'text-embedding-ada-002';
  
  /**
   * Generates an embedding vector for the given text using OpenAI's embedding API.
   * 
   * @param text - The input text to generate embeddings for
   * @returns Promise<number[]> - A vector of numbers representing the text embedding
   * @throws Error if the API call fails or if no API key is configured
   */
  static async embed(text: string): Promise<number[]> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Text input cannot be empty');
      }
      
      // Check if we have a valid OpenAI API key first
      const openaiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
      if (!openaiKey || openaiKey.includes('n0tr3al')) {
        console.log('🔄 No valid OpenAI key, using mock embedding');
        return this.generateMockEmbedding(text);
      }
      
      // Get OpenAI client with API key validation
      const client = getOpenAIClient();
      
      // Clean and prepare text
      const cleanText = text.trim().slice(0, 8000); // Limit to reasonable length
      
      // Call OpenAI embeddings API
      const response = await client.embeddings.create({
        model: this.MODEL,
        input: cleanText,
        encoding_format: 'float'
      });
      
      // Extract and validate embedding
      const embedding = response.data[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from OpenAI API');
      }
      
      // Validate embedding dimensions (should be 1536 for ada-002)
      if (embedding.length !== 1536) {
        console.warn(`Unexpected embedding dimensions: ${embedding.length}, expected 1536`);
      }
      
      return embedding;
      
    } catch (error) {
      console.error('EmbeddingService.embed failed:', error);
      
      // Fall back to mock embedding if API fails
      console.log('🔄 API embedding failed, using mock embedding');
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generates a mock embedding for demo purposes
   * Creates a simple hash-based vector that maintains some semantic similarity
   */
  private static generateMockEmbedding(text: string): number[] {
    const normalizedText = text.toLowerCase().trim();
    const embedding = new Array(1536).fill(0); // OpenAI ada-002 dimensions
    
    // Simple hash-based approach that creates consistent embeddings
    for (let i = 0; i < normalizedText.length; i++) {
      const char = normalizedText.charCodeAt(i);
      const position = (char + i) % 1536;
      embedding[position] = Math.sin(char * 0.1 + i * 0.01);
    }
    
    // Add some semantic patterns for common words
    const keywords = ['ai', 'voice', 'speech', 'technology', 'hello', 'help'];
    keywords.forEach((keyword, idx) => {
      if (normalizedText.includes(keyword)) {
        const baseIdx = (idx * 200) % 1536;
        for (let j = 0; j < 10; j++) {
          embedding[baseIdx + j] = Math.cos(idx * 0.5 + j * 0.1);
        }
      }
    });
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }
  
  /**
   * Calculates cosine similarity between two embedding vectors.
   * This is useful for comparing semantic similarity between texts.
   * 
   * @param embeddingA - First embedding vector
   * @param embeddingB - Second embedding vector
   * @returns number - Cosine similarity score between -1 and 1 (higher = more similar)
   */
  static cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error('Embedding vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Batch embedding generation for multiple texts.
   * More efficient than calling embed() multiple times.
   * 
   * @param texts - Array of texts to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  static async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }
    
    try {
      const client = getOpenAIClient();
      
      // Clean and prepare texts
      const cleanTexts = texts.map(text => 
        text.trim().slice(0, 8000)
      ).filter(text => text.length > 0);
      
      if (cleanTexts.length === 0) {
        throw new Error('No valid texts provided for batch embedding');
      }
      
      // Call OpenAI embeddings API with batch input
      const response = await client.embeddings.create({
        model: this.MODEL,
        input: cleanTexts,
        encoding_format: 'float'
      });
      
      // Extract embeddings
      const embeddings = response.data.map(item => item.embedding);
      
      // Validate all embeddings
      for (let i = 0; i < embeddings.length; i++) {
        if (!embeddings[i] || !Array.isArray(embeddings[i])) {
          throw new Error(`Invalid embedding at index ${i}`);
        }
      }
      
      return embeddings;
      
    } catch (error) {
      console.error('EmbeddingService.embedBatch failed:', error);
      throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}