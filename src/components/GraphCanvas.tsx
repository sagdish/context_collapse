import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Info } from 'lucide-react';
import { useCanvasInteraction } from '@/hooks';
import { graphSimulation, GraphRenderer, cn } from '@/utils';
import type { Node, Connection } from '@/types';

interface GraphCanvasProps {
  nodes: Node[];
  connections: Connection[];
  filteredConnections: Connection[];
  selectedNode: Node | null;
  searchQuery: string;
  filterStrength: number;
  onFilterStrengthChange: (value: number) => void;
  onNodeSelect: (node: Node | null) => void;
  onNodePositionUpdate: (nodeId: string, x: number, y: number) => void;
  actualTheme: 'light' | 'dark';
  isProcessing: boolean;
}

export function GraphCanvas({
  nodes,
  connections,
  filteredConnections,
  selectedNode,
  searchQuery,
  filterStrength,
  onFilterStrengthChange,
  onNodeSelect,
  onNodePositionUpdate,
  actualTheme,
  isProcessing
}: GraphCanvasProps) {
  const {
    canvasState,
    hoveredNode,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    closePopup,
    resetView,
  } = useCanvasInteraction();

  const { zoom, pan, canvasSize, draggedNode } = canvasState;
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const hoveredNodeRef = useRef<string | null>(hoveredNode);
  const draggedNodeRef = useRef<string | null>(draggedNode || null);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [showFilterTooltip, setShowFilterTooltip] = useState(false);
  const sliderValue = useMemo(() => Math.max(0, Math.min(1, 1 - filterStrength)), [filterStrength]);

  useEffect(() => {
    if (controlsCollapsed && showFilterTooltip) {
      setShowFilterTooltip(false);
    }
  }, [controlsCollapsed, showFilterTooltip]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  useEffect(() => {
    draggedNodeRef.current = draggedNode || null;
  }, [draggedNode]);

  // Initialize node positions
  useEffect(() => {
    if (nodes.length > 0) {
      graphSimulation.initializeNodePositions(nodes, canvasSize.width, canvasSize.height);
    }
  }, [nodes, canvasSize.width, canvasSize.height]);

  // Animation loop for force-directed simulation
  useEffect(() => {
    const canvas = document.getElementById('graph-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GraphRenderer(ctx, actualTheme === 'dark');
    
    const animate = () => {
    // Run simulation step
    graphSimulation.simulate(nodes, connections, draggedNodeRef.current || undefined);
      
      // Clear and setup transform
      renderer.clear(canvasSize.width, canvasSize.height);
      renderer.setupTransform(
        canvasSize.width,
        canvasSize.height,
        zoomRef.current,
        panRef.current
      );
      
      // Render connections
      renderer.renderConnections(filteredConnections, nodes, filterStrength);
      
      // Render nodes
      renderer.renderNodes(
        nodes,
        hoveredNodeRef.current,
        selectedNode?.id || null,
        searchQuery,
        zoomRef.current
      );
      
      // Restore transform
      renderer.restoreTransform();
      
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationId);
  }, [
    nodes,
    connections,
    filteredConnections,
    selectedNode?.id,
    searchQuery,
    filterStrength,
    hoveredNode,
    canvasSize.width,
    canvasSize.height,
    actualTheme
  ]);

  const isDark = actualTheme === 'dark';
  const popupMetrics = useMemo(() => {
    const popup = canvasState.popupPosition;
    if (!popup) return null;

    const PAD = 16;
    const maxWidth = Math.max(220, Math.min(320, canvasSize.width - PAD * 2));
    const maxHeight = Math.max(180, Math.min(320, canvasSize.height - PAD * 2));
    const left = Math.min(Math.max(popup.x + 20, PAD), canvasSize.width - maxWidth - PAD);
    const top = Math.min(Math.max(popup.y, PAD), canvasSize.height - maxHeight - PAD);

    return { left, top, maxWidth, maxHeight };
  }, [canvasState.popupPosition, canvasSize.width, canvasSize.height]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'w-full h-full rounded-xl shadow-lg border-2 relative overflow-hidden',
        isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
      )}
    >
      <canvas
        id="graph-canvas"
        width={canvasState.canvasSize.width}
        height={canvasState.canvasSize.height}
        className="w-full h-full cursor-move"
        onMouseDown={(e) => handleMouseDown(e, nodes, onNodeSelect)}
        onMouseMove={(e) => handleMouseMove(e, nodes, onNodePositionUpdate)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Zoom hint */}
      <div
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-md border text-xs',
          isDark
            ? 'bg-gray-800/90 border-gray-700 text-gray-300'
            : 'bg-white/90 border-gray-200 text-gray-600'
        )}
      >
        <span className="hidden sm:inline">Hold </span>
        <kbd
          className={cn(
            'px-1.5 py-0.5 rounded text-xs font-mono',
            isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-700'
          )}
        >
          {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
        </kbd>
        <span className="hidden sm:inline"> + </span>
        <span className="sm:hidden">+</span>
        <span>Scroll to zoom</span>
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={resetView}
        className={cn(
          'absolute bottom-4 right-4 rounded-full px-3 py-2 text-xs font-semibold shadow-lg border transition-colors',
          isDark ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-indigo-500 border-indigo-400 text-white hover:bg-indigo-600'
        )}
      >
        Reset view
      </button>

      {/* Graph Controls */}
      <div className={cn(
        'absolute top-4 right-4 rounded-lg p-3 shadow-lg border max-w-[240px]',
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <button
          type="button"
          onClick={() => setControlsCollapsed(prev => !prev)}
          className="w-full flex items-center justify-between gap-2 text-sm font-semibold"
          aria-expanded={!controlsCollapsed}
        >
          <span>Graph controls</span>
          {controlsCollapsed ? (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {!controlsCollapsed && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Zoom</div>
                <div className="text-xs text-gray-500">Cmd/Ctrl + scroll to adjust</div>
              </div>
              <span>{zoom.toFixed(1)}x</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Concepts</div>
                <div className="text-xs text-gray-500">Total nodes in the graph</div>
              </div>
              <span>{nodes.length}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Connections</div>
                <div className="text-xs text-gray-500">Visible links after filtering</div>
              </div>
              <span>{filteredConnections.length}</span>
            </div>

            <div className="relative flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Strength filter</span>
                <button
                  type="button"
                  className="ml-auto text-gray-400 hover:text-gray-500"
                  aria-label="About strength filter"
                  onMouseEnter={() => setShowFilterTooltip(true)}
                  onMouseLeave={() => setShowFilterTooltip(false)}
                  onFocus={() => setShowFilterTooltip(true)}
                  onBlur={() => setShowFilterTooltip(false)}
                >
                  <Info className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={sliderValue}
                onChange={(e) => onFilterStrengthChange(1 - parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
                aria-label="Filter connections by strength"
              />

              {showFilterTooltip && (
                <div className={cn(
                  'absolute top-full right-0 mt-2 w-56 text-xs rounded-lg border px-3 py-2 shadow-lg',
                  isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'
                )}>
                  Drag the slider to hide weaker AI-discovered connections and spotlight the strongest insights in your graph.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Node Popup */}
      {selectedNode && popupMetrics && (
        <div 
          className={cn(
            'absolute rounded-lg p-4 shadow-xl border z-10 overflow-y-auto',
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          )}
          style={{
            left: `${popupMetrics.left}px`,
            top: `${popupMetrics.top}px`,
            maxWidth: popupMetrics.maxWidth,
            maxHeight: popupMetrics.maxHeight,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-sm">{selectedNode.label}</h3>
            <button
              onClick={closePopup}
              className={cn(
                'p-1 rounded',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
            >
              ×
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mb-2">Connections</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {connections
              .filter(c => c.source === selectedNode.id || c.target === selectedNode.id)
              .slice(0, 3)
              .map((conn, idx) => {
                const otherNodeId = conn.source === selectedNode.id ? conn.target : conn.source;
                const otherNode = nodes.find(n => n.id === otherNodeId);
                return (
                  <div key={idx} className="text-xs">
                    <div className="font-medium flex items-center gap-1">
                      {otherNode?.label}
                      {conn.isSurprising && <span className="text-yellow-500">✨</span>}
                    </div>
                    <div className="text-gray-500 truncate">{conn.reason}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
          <div className={cn(
            'rounded-lg p-6 shadow-xl',
            isDark ? 'bg-gray-800' : 'bg-white'
          )}>
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <div className="text-sm">Processing...</div>
          </div>
        </div>
      )}
    </div>
  );
}