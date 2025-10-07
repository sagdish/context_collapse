import type { ConceptExtractionResponse, ConnectionSuggestion, SerendipityResponse } from '@/types';

/**
 * Mock API responses for demo mode when no API keys are available
 */
export class MockAPIClient {
  private mockDelay = 1500; // Simulate API delay

  private async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }

  /**
   * Mock concept extraction with predefined concepts based on content type
   */
  async extractConcepts(content: string): Promise<ConceptExtractionResponse> {
    await this.delay();
    
    // Generate concepts based on content keywords
    const concepts = this.generateMockConcepts(content);
    return { concepts };
  }

  /**
   * Mock connection finding with predefined surprising connections
   */
  async findConnections(existingConcepts: string[], newConcepts: string[]): Promise<ConnectionSuggestion[]> {
    await this.delay();
    
    const connections: ConnectionSuggestion[] = [];
    
    // Create some mock connections between existing and new concepts
    for (let i = 0; i < Math.min(3, existingConcepts.length); i++) {
      for (let j = 0; j < Math.min(2, newConcepts.length); j++) {
        if (Math.random() > 0.3) { // 70% chance of connection
          connections.push({
            existing: existingConcepts[i],
            new: newConcepts[j],
            strength: 0.3 + Math.random() * 0.6,
            reason: this.generateMockReason(existingConcepts[i], newConcepts[j]),
            surprising: Math.random() > 0.6 // 40% chance of being surprising
          });
        }
      }
    }
    
    return connections;
  }

  /**
   * Mock internal connections within concepts
   */
  async findInternalConnections(concepts: string[]): Promise<ConnectionSuggestion[]> {
    await this.delay();
    
    const connections: ConnectionSuggestion[] = [];
    
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        if (Math.random() > 0.5) { // 50% chance of connection
          connections.push({
            concept1: concepts[i],
            concept2: concepts[j],
            strength: 0.2 + Math.random() * 0.5,
            reason: this.generateMockReason(concepts[i], concepts[j]),
            surprising: false
          });
        }
      }
    }
    
    return connections.slice(0, 3); // Limit to 3 connections
  }

  /**
   * Mock serendipity generation with creative ideas
   */
  async generateSerendipity(concepts: string[]): Promise<SerendipityResponse> {
    await this.delay();
    
    const ideas = [
      `Combine "${concepts[0] || 'innovation'}" with "${concepts[1] || 'tradition'}" to create a hybrid approach that bridges old and new methodologies.`,
      `What if we applied "${concepts[2] || 'systems thinking'}" to "${concepts[0] || 'creativity'}"? This could revolutionize how we approach complex problems.`,
      `Cross-pollinate insights from "${concepts[1] || 'nature'}" and "${concepts[3] || 'technology'}" to develop biomimetic solutions.`,
      `Create a synthesis between "${concepts[0] || 'art'}" and "${concepts[2] || 'science'}" that could lead to breakthrough innovations.`,
      `Merge "${concepts[4] || 'community'}" dynamics with "${concepts[1] || 'digital platforms'}" to build more engaging virtual experiences.`
    ];
    
    return { ideas };
  }

  /**
   * Generate mock concepts based on content analysis
   */
  private generateMockConcepts(content: string): string[] {
    const words = content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const conceptPool = [
      'Innovation', 'Technology', 'Creativity', 'Systems Thinking', 'Design',
      'Collaboration', 'Strategy', 'Learning', 'Growth', 'Sustainability',
      'Communication', 'Leadership', 'Problem Solving', 'Efficiency', 'Quality',
      'Community', 'Network Effects', 'Scalability', 'User Experience', 'Data'
    ];
    
    // If content has specific keywords, prioritize related concepts
    const keywordMap: Record<string, string[]> = {
      'technology': ['Technology', 'Innovation', 'Digital Transformation', 'Automation'],
      'design': ['Design', 'User Experience', 'Aesthetics', 'Functionality'],
      'business': ['Strategy', 'Growth', 'Efficiency', 'Leadership'],
      'learning': ['Learning', 'Education', 'Knowledge', 'Skill Development'],
      'team': ['Collaboration', 'Leadership', 'Communication', 'Culture']
    };
    
    let selectedConcepts: string[] = [];
    
    // Check for keyword matches
    for (const [keyword, concepts] of Object.entries(keywordMap)) {
      if (words.includes(keyword)) {
        selectedConcepts.push(...concepts.slice(0, 2));
      }
    }
    
    // Fill remaining with random concepts
    while (selectedConcepts.length < 4) {
      const randomConcept = conceptPool[Math.floor(Math.random() * conceptPool.length)];
      if (!selectedConcepts.includes(randomConcept)) {
        selectedConcepts.push(randomConcept);
      }
    }
    
    return selectedConcepts.slice(0, 5); // Return 3-5 concepts
  }

  /**
   * Generate mock connection reasons
   */
  private generateMockReason(concept1: string, concept2: string): string {
    const patterns = [
      `Both ${concept1.toLowerCase()} and ${concept2.toLowerCase()} involve iterative processes and feedback loops.`,
      `${concept1} principles can be applied to enhance ${concept2.toLowerCase()} methodologies.`,
      `The intersection of ${concept1.toLowerCase()} and ${concept2.toLowerCase()} reveals hidden optimization opportunities.`,
      `${concept1} and ${concept2} share common patterns in their approach to complex systems.`,
      `Combining ${concept1.toLowerCase()} insights with ${concept2.toLowerCase()} creates novel possibilities.`
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
}

// Export singleton instance
export const mockAPIClient = new MockAPIClient();