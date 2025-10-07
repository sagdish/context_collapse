/**
 * File processing utilities
 */
export class FileProcessor {
  /**
   * Read and process uploaded files
   */
  static async processFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          resolve(content);
        } catch (error) {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      if (file.type === 'application/pdf') {
        // For PDF files, we'll read as text (basic implementation)
        // In a production app, you'd want to use a proper PDF parser
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  /**
   * Fetch content from URL with proper error handling
   */
  static async fetchURL(url: string): Promise<string> {
    try {
      // Handle Google Docs URLs
      if (url.includes('docs.google.com')) {
        const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (docId) {
          url = `https://docs.google.com/document/d/${docId}/export?format=txt`;
        }
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      
      if (!content.trim()) {
        throw new Error('URL returned empty content');
      }
      
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw new Error('Failed to fetch URL: Unknown error');
    }
  }

  /**
   * Validate file type
   */
  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'text/html'
    ];
    
    const allowedExtensions = ['.txt', '.md', '.pdf', '.html', '.htm'];
    
    return allowedTypes.includes(file.type) || 
           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Local storage utilities with error handling
 */
export class StorageManager {
  private static readonly GRAPH_KEY = 'context-collapse-graph';
  private static readonly API_KEY = 'context-collapse-api';
  private static readonly WELCOME_KEY = 'context-collapse-welcome';
  private static readonly THEME_KEY = 'context-collapse-theme';

  /**
   * Save graph data
   */
  static saveGraph(graph: any): boolean {
    try {
      localStorage.setItem(this.GRAPH_KEY, JSON.stringify(graph));
      return true;
    } catch (error) {
      console.error('Failed to save graph:', error);
      return false;
    }
  }

  /**
   * Load graph data
   */
  static loadGraph(): any | null {
    try {
      const saved = localStorage.getItem(this.GRAPH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load graph:', error);
      return null;
    }
  }

  /**
   * Save API configuration
   */
  static saveAPIConfig(config: any): boolean {
    try {
      localStorage.setItem(this.API_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Failed to save API config:', error);
      return false;
    }
  }

  /**
   * Load API configuration
   */
  static loadAPIConfig(): any | null {
    try {
      const saved = localStorage.getItem(this.API_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load API config:', error);
      return null;
    }
  }

  /**
   * Check if welcome has been seen
   */
  static hasSeenWelcome(): boolean {
    return localStorage.getItem(this.WELCOME_KEY) === 'true';
  }

  /**
   * Mark welcome as seen
   */
  static markWelcomeSeen(): void {
    localStorage.setItem(this.WELCOME_KEY, 'true');
  }

  /**
   * Save theme preference
   */
  static saveTheme(theme: string): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Load theme preference
   */
  static loadTheme(): string | null {
    return localStorage.getItem(this.THEME_KEY);
  }

  /**
   * Clear all data
   */
  static clearAll(): void {
    localStorage.removeItem(this.GRAPH_KEY);
    localStorage.removeItem(this.API_KEY);
  }
}