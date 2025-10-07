import React from 'react';
import { Sparkles, Plus, Zap, Eye, AlertCircle, Key } from 'lucide-react';
import { cn } from '@/utils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  actualTheme: 'light' | 'dark';
  isMockMode?: boolean;
}

export function WelcomeModal({ 
  isOpen, 
  onClose, 
  onGetStarted, 
  actualTheme,
  isMockMode = false
}: WelcomeModalProps) {
  if (!isOpen) return null;

  const isDark = actualTheme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          <h2 className="text-2xl font-bold">Welcome to Context Collapse</h2>
        </div>

        <p className={cn(
          'mb-4',
          isDark ? 'text-gray-300' : 'text-gray-600'
        )}>
          Your AI-powered knowledge graph that discovers surprising connections between ideas
        </p>

        {/* Demo Mode Warning */}
        {isMockMode && (
          <div className={cn(
            'p-4 rounded-lg border mb-4',
            isDark 
              ? 'bg-orange-900/30 border-orange-800 text-orange-200' 
              : 'bg-orange-50 border-orange-200 text-orange-800'
          )}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Demo Mode Active</h3>
                <p className="text-sm">
                  You're using mock AI responses. For real AI-powered insights, add your API key in Settings.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              isDark ? 'bg-indigo-900' : 'bg-indigo-100'
            )}>
              <Plus className={cn(
                'w-4 h-4',
                isDark ? 'text-indigo-400' : 'text-indigo-600'
              )} />
            </div>
            <div>
              <h3 className="font-medium mb-1">Add Your Knowledge</h3>
              <p className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Upload files, paste URLs, or add notes. {isMockMode ? 'Demo concepts' : 'AI'} will be extracted automatically.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              isDark ? 'bg-yellow-900' : 'bg-yellow-100'
            )}>
              <Sparkles className={cn(
                'w-4 h-4',
                isDark ? 'text-yellow-400' : 'text-yellow-600'
              )} />
            </div>
            <div>
              <h3 className="font-medium mb-1">Discover Surprising Connections</h3>
              <p className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {isMockMode ? 'Demo' : 'AI'} finds non-obvious relationships between your ideas, shown as dashed yellow lines.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              isDark ? 'bg-purple-900' : 'bg-purple-100'
            )}>
              <Zap className={cn(
                'w-4 h-4',
                isDark ? 'text-purple-400' : 'text-purple-600'
              )} />
            </div>
            <div>
              <h3 className="font-medium mb-1">Generate Serendipitous Ideas</h3>
              <p className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Click the lightning bolt to get creative project ideas from unexpected combinations.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              isDark ? 'bg-green-900' : 'bg-green-100'
            )}>
              <Eye className={cn(
                'w-4 h-4',
                isDark ? 'text-green-400' : 'text-green-600'
              )} />
            </div>
            <div>
              <h3 className="font-medium mb-1">Explore Your Graph</h3>
              <p className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Click nodes to see details. Drag to rearrange. Hold Cmd/Ctrl + Scroll to zoom. Use the filter to hide weak connections.
              </p>
            </div>
          </div>

          {isMockMode && (
            <div className="flex gap-3">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                isDark ? 'bg-blue-900' : 'bg-blue-100'
              )}>
                <Key className={cn(
                  'w-4 h-4',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h3 className="font-medium mb-1">Enable Real AI</h3>
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Get a Claude or OpenAI API key, then add it in Settings for real AI-powered insights.
                </p>
              </div>
            </div>
          )}
        </div>

        {!isMockMode && (
          <div className={cn(
            'p-3 rounded-lg border mb-4',
            isDark 
              ? 'bg-blue-900/30 border-blue-800' 
              : 'bg-blue-50 border-blue-200'
          )}>
            <p className={cn(
              'text-sm',
              isDark ? 'text-blue-200' : 'text-blue-800'
            )}>
              <strong>Tip:</strong> For the best experience, add diverse content from different domains. The magic happens when AI connects seemingly unrelated ideas!
            </p>
          </div>
        )}

        <button
          onClick={onGetStarted}
          className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          {isMockMode ? 'Try Demo Mode' : 'Get Started'}
        </button>

        <button
          onClick={onClose}
          className={cn(
            'w-full mt-2 px-4 py-2 transition-colors',
            isDark 
              ? 'text-gray-400 hover:text-gray-100' 
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}