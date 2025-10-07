import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/utils';

interface SerendipityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: string[];
  onGenerateMore: () => void;
  isProcessing: boolean;
  actualTheme: 'light' | 'dark';
}

export function SerendipityModal({
  isOpen,
  onClose,
  ideas,
  onGenerateMore,
  isProcessing,
  actualTheme
}: SerendipityModalProps) {
  if (!isOpen) return null;

  const isDark = actualTheme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Serendipitous Ideas
          </h2>
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

        <p className="text-sm text-gray-500 mb-4">
          Creative combinations from your knowledge graph
        </p>

        <div className="space-y-3">
          {ideas.map((idea, idx) => (
            <div 
              key={idx} 
              className={cn(
                'p-4 border rounded-lg transition-colors',
                isDark 
                  ? 'border-gray-600 hover:border-indigo-500' 
                  : 'border-gray-200 hover:border-indigo-500'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <p className="flex-1">{idea}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onGenerateMore}
          disabled={isProcessing}
          className="mt-4 w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Generating...' : 'Generate More Ideas'}
        </button>
      </div>
    </div>
  );
}