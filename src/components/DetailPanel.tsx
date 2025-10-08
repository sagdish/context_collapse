import { Trash2, Sparkles } from 'lucide-react';
import { formatDate, truncateText, cn } from '@/utils';
import type { Node, Connection } from '@/types';

interface DetailPanelProps {
  selectedNode: Node;
  connections: Connection[];
  nodes: Node[];
  onDeleteNode: (nodeId: string) => void;
  actualTheme: 'light' | 'dark';
}

export function DetailPanel({ 
  selectedNode, 
  connections, 
  nodes, 
  onDeleteNode, 
  actualTheme 
}: DetailPanelProps) {
  const isDark = actualTheme === 'dark';

  const nodeConnections = connections.filter(
    c => c.source === selectedNode.id || c.target === selectedNode.id
  );

  return (
    <div className={cn(
      'border-t lg:border-t-0 lg:border-l p-6 h-full flex flex-col gap-6',
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    )}>
      <h2 className="text-xl font-bold break-words">{selectedNode.label}</h2>

      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Type</div>
            <div className="capitalize">{selectedNode.type}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Added</div>
            <div>{formatDate(selectedNode.timestamp)}</div>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-2">All Connections ({nodeConnections.length})</div>
          <div className="space-y-2">
            {nodeConnections.map((conn, idx) => {
              const otherNodeId = conn.source === selectedNode.id ? conn.target : conn.source;
              const otherNode = nodes.find(n => n.id === otherNodeId);
              return (
                <div 
                  key={idx} 
                  className={cn(
                    'p-2 rounded border text-sm',
                    isDark ? 'border-gray-600' : 'border-gray-200'
                  )}
                >
                  <div className="font-medium flex items-center gap-2 break-words">
                    {otherNode?.label}
                    {conn.isSurprising && <Sparkles className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{conn.reason}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Strength: {(conn.strength * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
            
            {nodeConnections.length === 0 && (
              <div className={cn(
                'text-sm text-center py-4',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}>
                No connections found
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-2">Content Preview</div>
          <div className={cn(
            'text-sm p-3 rounded break-words',
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          )}>
            {truncateText(selectedNode.content, 500)}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDeleteNode(selectedNode.id)}
        className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete Node
      </button>
    </div>
  );
}