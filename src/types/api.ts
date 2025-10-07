export interface APIConfig {
  provider: 'claude' | 'openai' | 'custom';
  apiKey: string;
  baseUrl?: string;
}

export interface APIResponse {
  content: string;
  error?: string;
}

export interface ConceptExtractionResponse {
  concepts: string[];
}

export interface ConnectionSuggestion {
  existing?: string;
  new?: string;
  concept1?: string;
  concept2?: string;
  strength: number;
  reason: string;
  surprising: boolean;
}

export interface SerendipityResponse {
  ideas: string[];
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActualTheme = 'light' | 'dark';