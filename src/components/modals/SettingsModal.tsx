import React from 'react';
import { X, Sun, Moon, Monitor, Download, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/utils';
import type { ThemeMode, APIConfig } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  useCustomAPI: boolean;
  apiConfig: APIConfig;
  onToggleCustomAPI: (enabled: boolean) => void;
  onUpdateConfig: (config: Partial<APIConfig>) => void;
  onSaveConfig: () => boolean;
  onExportGraph: () => void;
  onImportGraph: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearData: () => void;
  actualTheme: 'light' | 'dark';
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  useCustomAPI,
  apiConfig,
  onToggleCustomAPI,
  onUpdateConfig,
  onSaveConfig,
  onExportGraph,
  onImportGraph,
  onClearData,
  actualTheme
}: SettingsModalProps) {
  if (!isOpen) return null;

  const isDark = actualTheme === 'dark';

  const handleSaveConfig = () => {
    const success = onSaveConfig();
    if (success) {
      alert('API configuration saved successfully!');
    } else {
      alert('Failed to save API configuration');
    }
  };

  const handleClearData = () => {
    if (confirm('Delete all data? This cannot be undone.')) {
      onClearData();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={cn(
        'rounded-lg p-6 max-w-2xl w-full shadow-xl my-8',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose}
            className={cn(
              'p-1 rounded transition-colors',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div>
            <h3 className="font-medium mb-3">Theme</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange('light')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                  theme === 'light' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' 
                    : isDark ? 'border-gray-600' : 'border-gray-300'
                )}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                  theme === 'dark' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' 
                    : isDark ? 'border-gray-600' : 'border-gray-300'
                )}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => onThemeChange('system')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                  theme === 'system' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' 
                    : isDark ? 'border-gray-600' : 'border-gray-300'
                )}
              >
                <Monitor className="w-4 h-4" />
                System
              </button>
            </div>
          </div>

          {/* API Configuration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">API Configuration</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomAPI}
                  onChange={(e) => onToggleCustomAPI(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Use custom API</span>
              </label>
            </div>

            {useCustomAPI && (
              <div className={cn(
                'space-y-3 p-4 border rounded-lg',
                isDark ? 'border-gray-600' : 'border-gray-300'
              )}>
                <div>
                  <label className="block text-sm font-medium mb-1">Provider</label>
                  <select
                    value={apiConfig.provider}
                    onChange={(e) => onUpdateConfig({ provider: e.target.value as APIConfig['provider'] })}
                    className={cn(
                      'w-full px-3 py-2 rounded border transition-colors',
                      isDark 
                        ? 'bg-gray-700 text-gray-100 border-gray-600' 
                        : 'bg-white text-gray-900 border-gray-300'
                    )}
                  >
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">OpenAI-compatible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="password"
                    value={apiConfig.apiKey}
                    onChange={(e) => onUpdateConfig({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    className={cn(
                      'w-full px-3 py-2 rounded border transition-colors',
                      isDark 
                        ? 'bg-gray-700 text-gray-100 border-gray-600' 
                        : 'bg-white text-gray-900 border-gray-300'
                    )}
                  />
                </div>

                {apiConfig.provider === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Base URL</label>
                    <input
                      type="url"
                      value={apiConfig.baseUrl}
                      onChange={(e) => onUpdateConfig({ baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1/chat/completions"
                      className={cn(
                        'w-full px-3 py-2 rounded border transition-colors',
                        isDark 
                          ? 'bg-gray-700 text-gray-100 border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-300'
                      )}
                    />
                  </div>
                )}

                <button
                  onClick={handleSaveConfig}
                  className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Save API Config
                </button>
              </div>
            )}

            {!useCustomAPI && (
              <p className="text-sm text-gray-500">Using default API from environment</p>
            )}
          </div>

          {/* Data Management */}
          <div>
            <h3 className="font-medium mb-3">Data Management</h3>
            <div className="space-y-2">
              <button
                onClick={onExportGraph}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors',
                  isDark 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                <Download className="w-4 h-4" />
                Export Graph
              </button>

              <label className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors',
                isDark 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-300 hover:bg-gray-100'
              )}>
                <Upload className="w-4 h-4" />
                Import Graph
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportGraph}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>
          </div>

          {/* Graph Legend */}
          <div>
            <h3 className="font-medium mb-3">Graph Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500"></div>
                <span>Surprising connection (dashed)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-gray-400"></div>
                <span>Regular connection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">✨</span>
                <span>Unexpected relationship</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}