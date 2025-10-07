import { useState, useEffect } from 'react';
import type { ThemeMode, ActualTheme } from '@/types';
import { StorageManager } from '@/utils';

/**
 * Custom hook for theme management with system preference detection
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [actualTheme, setActualTheme] = useState<ActualTheme>('light');

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = StorageManager.loadTheme() as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Update actual theme when theme changes or system preference changes
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateActualTheme);

    return () => mediaQuery.removeEventListener('change', updateActualTheme);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', actualTheme === 'dark');
  }, [actualTheme]);

  const changeTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    StorageManager.saveTheme(newTheme);
  };

  return {
    theme,
    actualTheme,
    setTheme: changeTheme,
  };
}