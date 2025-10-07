import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, CanvasState } from '@/types';

/**
 * Custom hook for managing canvas interactions (zoom, pan, drag, etc.)
 */
export function useCanvasInteraction() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDraggingCanvas: false,
    draggedNode: null,
    lastMousePos: { x: 0, y: 0 },
    popupPosition: null,
    canvasSize: { width: 800, height: 600 }
  });
  
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasState(prev => ({
          ...prev,
          canvasSize: {
            width: rect.width,
            height: rect.height
          }
        }));
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  /**
   * Get node at screen position
   */
  const getNodeAtPosition = useCallback((screenX: number, screenY: number, nodes: Node[]): Node | null => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const canvasX = (screenX - rect.left - canvasState.canvasSize.width / 2 - canvasState.pan.x) / canvasState.zoom;
    const canvasY = (screenY - rect.top - canvasState.canvasSize.height / 2 - canvasState.pan.y) / canvasState.zoom;

    return nodes.find(node => {
      const dx = (node.x || 0) - canvasX;
      const dy = (node.y || 0) - canvasY;
      return Math.sqrt(dx * dx + dy * dy) < 12;
    }) || null;
  }, [canvasState.canvasSize, canvasState.pan, canvasState.zoom]);

  /**
   * Handle mouse down on canvas
   */
  const handleMouseDown = useCallback((e: React.MouseEvent, nodes: Node[], onNodeSelect: (node: Node | null) => void) => {
    const node = getNodeAtPosition(e.clientX, e.clientY, nodes);
    
    if (node) {
      setCanvasState(prev => ({ ...prev, draggedNode: node.id }));
      onNodeSelect(node);
      
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasState(prev => ({
          ...prev,
          popupPosition: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }
        }));
      }
    } else {
      setCanvasState(prev => ({
        ...prev,
        isDraggingCanvas: true,
        lastMousePos: { x: e.clientX, y: e.clientY }
      }));
      onNodeSelect(null);
      setCanvasState(prev => ({ ...prev, popupPosition: null }));
    }
  }, [getNodeAtPosition]);

  /**
   * Handle mouse move on canvas
   */
  const handleMouseMove = useCallback((e: React.MouseEvent, nodes: Node[], onNodePositionUpdate: (nodeId: string, x: number, y: number) => void) => {
    const node = getNodeAtPosition(e.clientX, e.clientY, nodes);
    setHoveredNode(node?.id || null);

    if (canvasState.draggedNode) {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - canvasState.canvasSize.width / 2 - canvasState.pan.x) / canvasState.zoom;
      const canvasY = (e.clientY - rect.top - canvasState.canvasSize.height / 2 - canvasState.pan.y) / canvasState.zoom;

      onNodePositionUpdate(canvasState.draggedNode, canvasX, canvasY);
      
      if (canvasState.popupPosition) {
        setCanvasState(prev => ({
          ...prev,
          popupPosition: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }
        }));
      }
    } else if (canvasState.isDraggingCanvas) {
      const dx = e.clientX - canvasState.lastMousePos.x;
      const dy = e.clientY - canvasState.lastMousePos.y;
      
      setCanvasState(prev => ({
        ...prev,
        pan: { x: prev.pan.x + dx, y: prev.pan.y + dy },
        lastMousePos: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [canvasState, getNodeAtPosition]);

  /**
   * Handle mouse up on canvas
   */
  const handleMouseUp = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      draggedNode: null,
      isDraggingCanvas: false
    }));
  }, []);

  /**
   * Handle wheel event for zooming (non-passive listener)
   */
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setCanvasState(prev => ({
        ...prev,
        zoom: Math.max(0.5, Math.min(3, prev.zoom * delta))
      }));
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const listener = (event: WheelEvent) => handleWheel(event);
    container.addEventListener('wheel', listener, { passive: false });

    return () => {
      container.removeEventListener('wheel', listener);
    };
  }, [handleWheel]);

  /**
   * Close popup
   */
  const closePopup = useCallback(() => {
    setCanvasState(prev => ({ ...prev, popupPosition: null }));
  }, []);

  /**
   * Reset view to center
   */
  const resetView = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }));
  }, []);

  return {
    // State
    canvasState,
    hoveredNode,
    containerRef,
    
    // Actions
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    closePopup,
    resetView,
    setHoveredNode,
  };
}