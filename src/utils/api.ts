import type { APIConfig, APIResponse, ConceptExtractionResponse, ConnectionSuggestion, SerendipityResponse } from '@/types';
import { safeJsonParse } from './helpers';
import { mockAPIClient } from './mockApi';

/**
 * Enhanced API client with environment variables, mock mode, and proper error handling
 */
export class APIClient {
  private config: APIConfig | null = null;
  private useCustomAPI = false;
  private isMockMode = false;

  constructor() {
    // Check for environment variables on initialization
    this.initializeFromEnv();
  }

  /**
   * Initialize API config from environment variables
   */
  private initializeFromEnv() {
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const customUrl = import.meta.env.VITE_CUSTOM_API_URL;
    const customKey = import.meta.env.VITE_CUSTOM_API_KEY;

    if (anthropicKey) {
      this.config = {
        provider: 'claude',
        apiKey: anthropicKey
      };
      this.useCustomAPI = true;
    } else if (openaiKey) {
      this.config = {
        provider: 'openai',
        apiKey: openaiKey
      };
      this.useCustomAPI = true;
    } else if (customUrl && customKey) {
      this.config = {
        provider: 'custom',
        apiKey: customKey,
        baseUrl: customUrl
      };
      this.useCustomAPI = true;
    } else {
      // No API keys found, enable mock mode
      this.isMockMode = true;
      console.warn('🔄 No API keys found. Running in demo mode with mock responses.');
      console.info('💡 To use real AI features, add your API key to .env file or configure in settings.');
    }
  }

  setConfig(config: APIConfig, useCustom: boolean) {
    this.config = config;
    this.useCustomAPI = useCustom;
    
    // Disable mock mode if valid config is provided
    if (useCustom && config.apiKey) {
      this.isMockMode = false;
    }
  }

  /**
   * Check if running in mock mode
   */
  isInMockMode(): boolean {
    return this.isMockMode;
  }

  /**
   * Main LLM API call with robust error handling and mock fallback
   */
  async callLLM(prompt: string): Promise<APIResponse> {
    // If in mock mode, return mock response
    if (this.isMockMode) {
      return { content: 'Mock response - configure API keys for real AI features' };
    }

    const config = this.useCustomAPI && this.config?.apiKey ? this.config : null;
    
    try {
      if (!config && !this.useCustomAPI) {
        throw new Error('No API configuration available');
      }

      if (config?.provider === 'claude') {
        return await this.callClaude(prompt, config);
      } else if (config) {
        return await this.callOpenAI(prompt, config);
      }
      
      // Fallback error case
      throw new Error('No valid API configuration found');
    } catch (error) {
      console.error('API call failed:', error);
      
      // Fallback to mock mode on API failure
      console.warn('🔄 API call failed, falling back to demo mode');
      this.isMockMode = true;
      
      return { 
        content: '', 
        error: error instanceof Error ? error.message : 'Unknown API error' 
      };
    }
  }

  private async callClaude(prompt: string, config: APIConfig): Promise<APIResponse> {
    const response = await fetch(config.baseUrl || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.content[0].text };
  }

  private async callOpenAI(prompt: string, config: APIConfig): Promise<APIResponse> {
    const response = await fetch(
      config?.baseUrl || 'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config?.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        })
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  }

  /**
   * Extract concepts from content (with mock fallback)
   */
  async extractConcepts(content: string): Promise<ConceptExtractionResponse> {
    if (this.isMockMode) {
      return await mockAPIClient.extractConcepts(content);
    }

    const prompt = `Analyze this content and extract 3-7 key concepts or themes. Return ONLY a JSON array of strings, nothing else.

Content: ${content.substring(0, 3000)}

Return format: ["concept1", "concept2", "concept3"]`;

    const response = await this.callLLM(prompt);
    if (response.error || !response.content) {
      // Fallback to mock on error
      return await mockAPIClient.extractConcepts(content);
    }

    const cleanedResponse = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const concepts = safeJsonParse<string[]>(cleanedResponse, []);
    
    return { concepts };
  }

  /**
   * Find connections between existing and new concepts (with mock fallback)
   */
  async findConnections(existingConcepts: string[], newConcepts: string[]): Promise<ConnectionSuggestion[]> {
    if (this.isMockMode) {
      return await mockAPIClient.findConnections(existingConcepts, newConcepts);
    }

    const prompt = `Given these existing concepts: ${existingConcepts.join(', ')}

And these new concepts: ${newConcepts.join(', ')}

Find surprising and non-obvious connections between them. Focus on unexpected relationships, not obvious ones.

Return ONLY a JSON array of connections in this exact format:
[
  {
    "existing": "existing concept name",
    "new": "new concept name", 
    "strength": 0.5,
    "reason": "brief explanation",
    "surprising": true
  }
]

Return at least 5 connections, prioritizing surprising ones. Return ONLY valid JSON, no other text.`;

    const response = await this.callLLM(prompt);
    if (response.error || !response.content) {
      return await mockAPIClient.findConnections(existingConcepts, newConcepts);
    }

    const cleanedResponse = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return safeJsonParse<ConnectionSuggestion[]>(cleanedResponse, []);
  }

  /**
   * Find internal connections within a set of concepts (with mock fallback)
   */
  async findInternalConnections(concepts: string[]): Promise<ConnectionSuggestion[]> {
    if (this.isMockMode) {
      return await mockAPIClient.findInternalConnections(concepts);
    }

    const prompt = `Given these concepts from the same content: ${concepts.join(', ')}

Find connections between these concepts. They are from the same source, so look for how they relate to each other.

Return ONLY a JSON array of connections in this exact format:
[
  {
    "concept1": "first concept name",
    "concept2": "second concept name", 
    "strength": 0.5,
    "reason": "brief explanation",
    "surprising": false
  }
]

Return at least 3 connections. Return ONLY valid JSON, no other text.`;

    const response = await this.callLLM(prompt);
    if (response.error || !response.content) {
      return await mockAPIClient.findInternalConnections(concepts);
    }

    const cleanedResponse = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return safeJsonParse<ConnectionSuggestion[]>(cleanedResponse, []);
  }

  /**
   * Generate serendipitous ideas from concepts (with mock fallback)
   */
  async generateSerendipity(concepts: string[]): Promise<SerendipityResponse> {
    if (this.isMockMode) {
      return await mockAPIClient.generateSerendipity(concepts);
    }

    const prompt = `Given these concepts in a knowledge graph: ${concepts.join(', ')}

Generate 5 creative ideas by combining unexpected concepts. Focus on:
- Novel intersections that have not been explored
- Surprising combinations
- Actionable project ideas
- Creative synthesis

Return ONLY a JSON array of strings, each being one creative idea:
["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]`;

    const response = await this.callLLM(prompt);
    if (response.error || !response.content) {
      return await mockAPIClient.generateSerendipity(concepts);
    }

    const cleanedResponse = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const ideas = safeJsonParse<string[]>(cleanedResponse, []);
    
    return { ideas };
  }
}

// Export singleton instance
export const apiClient = new APIClient();