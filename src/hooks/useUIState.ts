import { useState, useCallback } from 'react';
import type { UIState } from '@/types';
import { apiClient, StorageManager } from '@/utils';

/**
 * Custom hook for managing UI state and modals
 */
export function useUIState() {
  const [uiState, setUIState] = useState<UIState>({
    showSettings: false,
    showUpload: false,
    showSerendipity: false,
    showWelcome: !StorageManager.hasSeenWelcome(),
    isProcessing: false,
    serendipityIdeas: []
  });

  /**
   * Toggle modal visibility
   */
  const toggleModal = useCallback((modal: keyof Pick<UIState, 'showSettings' | 'showUpload' | 'showSerendipity' | 'showWelcome'>, show?: boolean) => {
    setUIState(prev => ({
      ...prev,
      [modal]: show !== undefined ? show : !prev[modal]
    }));
  }, []);

  /**
   * Set processing state
   */
  const setProcessing = useCallback((processing: boolean) => {
    setUIState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  /**
   * Generate serendipitous ideas
   */
  const generateSerendipity = useCallback(async (concepts: string[]) => {
    if (concepts.length < 3) {
      throw new Error('Add more content to discover serendipitous connections!');
    }

    setProcessing(true);
    try {
      const { ideas } = await apiClient.generateSerendipity(concepts);
      setUIState(prev => ({
        ...prev,
        serendipityIdeas: ideas,
        showSerendipity: true
      }));
      return ideas;
    } finally {
      setProcessing(false);
    }
  }, [setProcessing]);

  /**
   * Mark welcome as seen
   */
  const dismissWelcome = useCallback(() => {
    StorageManager.markWelcomeSeen();
    setUIState(prev => ({ ...prev, showWelcome: false }));
  }, []);

  /**
   * Close all modals
   */
  const closeAllModals = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      showSettings: false,
      showUpload: false,
      showSerendipity: false,
      showWelcome: false
    }));
  }, []);

  return {
    // State
    uiState,
    
    // Actions
    toggleModal,
    setProcessing,
    generateSerendipity,
    dismissWelcome,
    closeAllModals,
  };
}