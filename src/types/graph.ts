export interface Node {
  id: string;
  label: string;
  content: string;
  type: 'note' | 'url' | 'file';
  timestamp: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Connection {
  source: string;
  target: string;
  strength: number;
  reason: string;
  isSurprising: boolean;
}

export interface KnowledgeGraph {
  nodes: Node[];
  connections: Connection[];
}

export interface GraphState {
  graph: KnowledgeGraph;
  selectedNode: Node | null;
  hoveredNode: string | null;
  searchQuery: string;
  filterStrength: number;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  isDraggingCanvas: boolean;
  draggedNode: string | null;
  lastMousePos: { x: number; y: number };
  popupPosition: { x: number; y: number } | null;
  canvasSize: { width: number; height: number };
}

export interface UIState {
  showSettings: boolean;
  showUpload: boolean;
  showSerendipity: boolean;
  showWelcome: boolean;
  isProcessing: boolean;
  serendipityIdeas: string[];
}