import { Search, Plus, Zap, Eye, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  onSerendipityClick: () => void;
  onWelcomeClick: () => void;
  onSettingsClick: () => void;
  isProcessing: boolean;
  actualTheme: 'light' | 'dark';
  isMockMode?: boolean;
}

export function Header({
  searchQuery,
  onSearchChange,
  onUploadClick,
  onSerendipityClick,
  onWelcomeClick,
  onSettingsClick,
  isProcessing,
  actualTheme,
  isMockMode = false
}: HeaderProps) {
  const isDark = actualTheme === 'dark';

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b px-4 py-3 transition-colors',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 text-indigo-500">
            <Zap className="w-full h-full" />
          </div>
          <h1 className="text-xl font-bold hidden sm:block">Context Collapse</h1>
          
          {/* Mock Mode Indicator */}
          {isMockMode && (
            <div className={cn(
              'hidden md:flex items-center gap-1 px-2 py-1 rounded text-xs',
              isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
            )}>
              <AlertCircle className="w-3 h-3" />
              Demo Mode
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                isDark 
                  ? 'bg-gray-700 text-gray-100 border-gray-600' 
                  : 'bg-white text-gray-900 border-gray-300'
              )}
              title="Search for concepts in your knowledge graph - matching nodes will be highlighted in blue"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUploadClick}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
            title="Add new content - upload files, paste URLs, or add notes"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button
            onClick={onSerendipityClick}
            disabled={isProcessing}
            className={cn(
              'p-2 rounded-lg transition-colors disabled:opacity-50',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
            title="Generate creative ideas from unexpected concept combinations"
          >
            <Zap className="w-5 h-5" />
          </button>
          
          <button
            onClick={onWelcomeClick}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
            title="Show help and tutorial"
          >
            <Eye className="w-5 h-5" />
          </button>
          
          <button
            onClick={onSettingsClick}
            className={cn(
              'p-2 rounded-lg transition-colors relative',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
            title="Open settings - configure theme, API, and manage data"
          >
            <Settings className="w-5 h-5" />
            {isMockMode && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}