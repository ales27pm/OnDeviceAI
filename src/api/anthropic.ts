/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.

Valid model names: 
claude-sonnet-4-20250514
claude-3-7-sonnet-latest
claude-3-5-haiku-latest
*/
import Anthropic from "@anthropic-ai/sdk";

// Fetch-based implementation to avoid C++ bridge issues
export const callAnthropicAPI = async (prompt: string): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY || 
                 process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
  
  console.log('🔑 Calling Anthropic API with fetch...');
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Anthropic API response received');
    
    if (data.content && data.content.length > 0 && data.content[0].text) {
      return data.content[0].text;
    } else {
      throw new Error('Invalid response format from Anthropic API');
    }
  } catch (error) {
    console.error('❌ Fetch-based Anthropic API call failed:', error);
    throw error;
  }
};

export const getAnthropicClient = () => {
  try {
    // Check multiple possible locations for the API key
    const apiKey = process.env.ANTHROPIC_API_KEY || 
                   process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
    
    console.log('🔑 Anthropic API key found:', apiKey ? 'Yes' : 'Not found');
    
    if (!apiKey) {
      console.warn("Anthropic API key not found in environment variables");
      throw new Error("No Anthropic API key available");
    }
    
    return new Anthropic({
      apiKey: apiKey,
      maxRetries: 1, // Reduce retries to prevent hangs
      timeout: 30000, // 30 second timeout
    });
  } catch (error) {
    console.error('Failed to create Anthropic client:', error);
    throw error;
  }
};
