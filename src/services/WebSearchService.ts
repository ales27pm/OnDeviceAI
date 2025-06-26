import { getOpenAIClient } from '../api/openai';
import { getAnthropicClient } from '../api/anthropic';

/**
 * Web search result interface
 */
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  timestamp?: string;
}

/**
 * Web search response interface
 */
export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  summary: string;
  totalResults: number;
}

/**
 * WebSearchService provides web search capabilities with AI-powered summarization
 * Uses multiple search engines and AI models for comprehensive results
 */
export class WebSearchService {
  private static instance: WebSearchService | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): WebSearchService {
    if (!this.instance) {
      this.instance = new WebSearchService();
    }
    return this.instance;
  }

  /**
   * Search the web for information
   */
  async searchWeb(query: string, maxResults: number = 10): Promise<WebSearchResponse> {
    try {
      console.log(`🔍 Searching web for: "${query}"`);

      // For now, we'll simulate web search results since we don't have a search API
      // In production, you would integrate with Google Search API, Bing API, or SerpAPI
      const mockResults = await this.getMockSearchResults(query, maxResults);

      // Generate AI summary of search results
      const summary = await this.generateSearchSummary(query, mockResults);

      const response: WebSearchResponse = {
        query,
        results: mockResults,
        summary,
        totalResults: mockResults.length
      };

      console.log(`✅ Web search completed: ${mockResults.length} results`);
      return response;

    } catch (error) {
      console.error('❌ Web search failed:', error);
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mock search results (replace with real API in production)
   */
  private async getMockSearchResults(query: string, maxResults: number): Promise<WebSearchResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lowerQuery = query.toLowerCase();
    let results: WebSearchResult[] = [];

    if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) {
      results = [
        {
          title: "What is Artificial Intelligence? | IBM",
          url: "https://www.ibm.com/topics/artificial-intelligence",
          snippet: "Artificial intelligence leverages computers and machines to mimic the problem-solving and decision-making capabilities of the human mind.",
          source: "IBM"
        },
        {
          title: "Artificial Intelligence News -- ScienceDaily",
          url: "https://www.sciencedaily.com/news/computers_math/artificial_intelligence/",
          snippet: "Artificial Intelligence news. Everything on AI including futuristic robots with artificial intelligence, computer models of human intelligence and more.",
          source: "ScienceDaily"
        },
        {
          title: "OpenAI",
          url: "https://openai.com/",
          snippet: "OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
          source: "OpenAI"
        }
      ];
    } else if (lowerQuery.includes('react native') || lowerQuery.includes('mobile')) {
      results = [
        {
          title: "React Native · Learn once, write anywhere",
          url: "https://reactnative.dev/",
          snippet: "React Native combines the best parts of native development with React, a best-in-class JavaScript library for building user interfaces.",
          source: "React Native"
        },
        {
          title: "React Native Tutorial - W3Schools",
          url: "https://www.w3schools.com/react/react_native_intro.asp",
          snippet: "React Native is a JavaScript framework for writing real, natively rendering mobile applications for iOS and Android.",
          source: "W3Schools"
        }
      ];
    } else if (lowerQuery.includes('weather')) {
      results = [
        {
          title: "Weather Forecast & Current Conditions",
          url: "https://weather.com/",
          snippet: "Get the latest weather forecasts, alerts, and current conditions for your location and around the world.",
          source: "Weather.com"
        },
        {
          title: "National Weather Service",
          url: "https://www.weather.gov/",
          snippet: "Official weather forecasts, warnings, meteorological products for forecasting the weather, and information about meteorology.",
          source: "NOAA"
        }
      ];
    } else {
      // Generic results
      results = [
        {
          title: `Search Results for "${query}"`,
          url: "https://example.com/search",
          snippet: `Here are the top search results for your query about ${query}. This is a demonstration of web search capabilities.`,
          source: "Search Engine"
        },
        {
          title: `${query} - Wikipedia`,
          url: "https://wikipedia.org/",
          snippet: `Wikipedia article about ${query} with comprehensive information from reliable sources.`,
          source: "Wikipedia"
        },
        {
          title: `Latest News about ${query}`,
          url: "https://news.example.com/",
          snippet: `Recent news articles and updates related to ${query} from various news sources.`,
          source: "News"
        }
      ];
    }

    // Add timestamps and limit results
    return results.slice(0, maxResults).map(result => ({
      ...result,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Generate AI summary of search results
   */
  private async generateSearchSummary(query: string, results: WebSearchResult[]): Promise<string> {
    try {
      const searchContext = results.map(result => 
        `Title: ${result.title}\nSource: ${result.source}\nSnippet: ${result.snippet}`
      ).join('\n\n');

      const prompt = `Based on these web search results for "${query}", provide a concise, informative summary:

${searchContext}

Please provide a comprehensive summary that:
1. Answers the user's question directly
2. Synthesizes information from multiple sources
3. Highlights key points and insights
4. Mentions source credibility when relevant
5. Keeps the response focused and actionable

Summary:`;

      // Use available AI service to generate summary
      const anthropicKey = process.env.ANTHROPIC_API_KEY || 
                          process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;

      if (anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes('n0tr3al')) {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-latest',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.3,
        });

        if (response.content && response.content.length > 0) {
          const textContent = response.content.find(block => block.type === 'text');
          if (textContent && 'text' in textContent) {
            return textContent.text;
          }
        }
      }

      // Fallback summary
      return `Found ${results.length} search results for "${query}". The search covered information from ${[...new Set(results.map(r => r.source))].join(', ')}. Key topics include: ${results.map(r => r.title).join('; ')}.`;

    } catch (error) {
      console.warn('⚠️  Failed to generate AI summary, using fallback:', error);
      return `Search completed for "${query}" with ${results.length} results from various sources including ${[...new Set(results.map(r => r.source))].join(', ')}.`;
    }
  }

  /**
   * Search web and get simple text response
   */
  async searchAndSummarize(query: string): Promise<string> {
    const searchResponse = await this.searchWeb(query, 5);
    return `**Web Search Results for "${query}":**\n\n${searchResponse.summary}\n\n**Sources:**\n${searchResponse.results.map(r => `• ${r.title} (${r.source})`).join('\n')}`;
  }
}