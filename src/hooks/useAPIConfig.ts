import { useState, useEffect, useCallback } from 'react';
import type { APIConfig } from '@/types';
import { apiClient, StorageManager } from '@/utils';

/**
 * Custom hook for managing API configuration
 */
export function useAPIConfig() {
  const [useCustomAPI, setUseCustomAPI] = useState(false);
  const [apiConfig, setAPIConfig] = useState<APIConfig>({
    provider: 'claude',
    apiKey: '',
    baseUrl: ''
  });

  // Load saved API config on mount
  useEffect(() => {
    const savedConfig = StorageManager.loadAPIConfig();
    if (savedConfig) {
      setAPIConfig(savedConfig);
      setUseCustomAPI(!!savedConfig.apiKey);
    }
  }, []);

  // Update API client when config changes
  useEffect(() => {
    apiClient.setConfig(apiConfig, useCustomAPI);
  }, [apiConfig, useCustomAPI]);

  /**
   * Update API configuration
   */
  const updateConfig = useCallback((newConfig: Partial<APIConfig>) => {
    setAPIConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Save API configuration to storage
   */
  const saveConfig = useCallback(() => {
    const success = StorageManager.saveAPIConfig(apiConfig);
    return success;
  }, [apiConfig]);

  /**
   * Toggle custom API usage
   */
  const toggleCustomAPI = useCallback((enabled: boolean) => {
    setUseCustomAPI(enabled);
  }, []);

  return {
    // State
    useCustomAPI,
    apiConfig,
    
    // Actions
    updateConfig,
    saveConfig,
    toggleCustomAPI,
  };
}