import type { Node, Connection } from '@/types';

/**
 * Force-directed graph simulation utilities
 */
export class GraphSimulation {
  private readonly baseAlpha = 0.3;
  private alpha = this.baseAlpha;
  private readonly minAlpha = 0.05;
  private readonly cooling = 0.995;
  private readonly centerForce = 0.0025;
  private repulsion = 5000;
  private attraction = 0.01;
  private damping = 0.8;

  /**
   * Run one step of the force-directed simulation
   */
  simulate(nodes: Node[], connections: Connection[], draggedNodeId?: string): void {
    // Apply gentle centering force to counter drift
    this.applyCenteringForce(nodes, draggedNodeId);

    // Apply repulsion forces between all nodes
    this.applyRepulsionForces(nodes, draggedNodeId);
    
    // Apply attraction forces for connected nodes
    this.applyAttractionForces(nodes, connections, draggedNodeId);
    
    // Update positions (except for dragged node)
    this.updatePositions(nodes, draggedNodeId);

    // Gradually cool the simulation so it eventually settles
    this.alpha = Math.max(this.minAlpha, this.alpha * this.cooling);
  }

  private energize(amount = 0.05): void {
    this.alpha = Math.min(this.baseAlpha, this.alpha + amount);
  }

  private applyCenteringForce(nodes: Node[], draggedNodeId?: string): void {
    if (this.centerForce <= 0) return;

    nodes.forEach(node => {
      if (node.id === draggedNodeId) return;

      node.vx = (node.vx || 0) - (node.x || 0) * this.centerForce * this.alpha;
      node.vy = (node.vy || 0) - (node.y || 0) * this.centerForce * this.alpha;
    });
  }

  private applyRepulsionForces(nodes: Node[], draggedNodeId?: string): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        const dx = (node2.x || 0) - (node1.x || 0);
        const dy = (node2.y || 0) - (node1.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (this.repulsion * this.alpha) / (dist * dist);
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (node1.id !== draggedNodeId) {
          node1.vx = (node1.vx || 0) - fx;
          node1.vy = (node1.vy || 0) - fy;
        }
        if (node2.id !== draggedNodeId) {
          node2.vx = (node2.vx || 0) + fx;
          node2.vy = (node2.vy || 0) + fy;
        }
      }
    }
  }

  private applyAttractionForces(nodes: Node[], connections: Connection[], draggedNodeId?: string): void {
    connections.forEach(conn => {
      const source = nodes.find(n => n.id === conn.source);
      const target = nodes.find(n => n.id === conn.target);
      
      if (source && target) {
        const dx = (target.x || 0) - (source.x || 0);
        const dy = (target.y || 0) - (source.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = dist * this.attraction * (conn.strength || 0.1) * this.alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (source.id !== draggedNodeId) {
          source.vx = (source.vx || 0) + fx;
          source.vy = (source.vy || 0) + fy;
        }

        if (target.id !== draggedNodeId) {
          target.vx = (target.vx || 0) - fx;
          target.vy = (target.vy || 0) - fy;
        }
      }
    });
  }

  private updatePositions(nodes: Node[], draggedNodeId?: string): void {
    nodes.forEach(node => {
      if (node.id !== draggedNodeId) {
        node.x = (node.x || 0) + (node.vx || 0);
        node.y = (node.y || 0) + (node.vy || 0);
        node.vx = (node.vx || 0) * this.damping;
        node.vy = (node.vy || 0) * this.damping;

        // Snap very small velocities to zero to avoid micro jitter
        if (Math.abs(node.vx || 0) < 0.0001) node.vx = 0;
        if (Math.abs(node.vy || 0) < 0.0001) node.vy = 0;
      }
    });
  }

  /**
   * Initialize random positions for new nodes
   */
  initializeNodePositions(nodes: Node[], canvasWidth = 800, canvasHeight = 600): void {
    nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) {
        node.x = Math.random() * canvasWidth - canvasWidth / 2;
        node.y = Math.random() * canvasHeight - canvasHeight / 2;
        node.vx = 0;
        node.vy = 0;
      }
    });

    // Re-energize simulation when new nodes appear
    this.energize(0.1);
  }
}

/**
 * Canvas rendering utilities
 */
export class GraphRenderer {
  private ctx: CanvasRenderingContext2D;
  private isDark: boolean;

  constructor(ctx: CanvasRenderingContext2D, isDark = false) {
    this.ctx = ctx;
    this.isDark = isDark;
  }

  setTheme(isDark: boolean): void {
    this.isDark = isDark;
  }

  /**
   * Clear the canvas
   */
  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * Set up transformation matrix
   */
  setupTransform(width: number, height: number, zoom: number, pan: { x: number; y: number }): void {
    this.ctx.save();
    this.ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    this.ctx.scale(zoom, zoom);
  }

  /**
   * Restore transformation matrix
   */
  restoreTransform(): void {
    this.ctx.restore();
  }

  /**
   * Render connections between nodes
   */
  renderConnections(connections: Connection[], nodes: Node[], filterStrength: number): void {
    connections.forEach(conn => {
      if (conn.strength < filterStrength) return;
      
      const source = nodes.find(n => n.id === conn.source);
      const target = nodes.find(n => n.id === conn.target);
      
      if (source && target) {
        this.ctx.beginPath();
        this.ctx.moveTo(source.x || 0, source.y || 0);
        this.ctx.lineTo(target.x || 0, target.y || 0);
        
        if (conn.isSurprising) {
          this.ctx.strokeStyle = this.isDark ? '#fbbf24' : '#f59e0b';
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([5, 5]);
        } else {
          this.ctx.strokeStyle = this.isDark ? '#4b5563' : '#d1d5db';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([]);
        }
        
        this.ctx.globalAlpha = conn.strength;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
      }
    });
  }

  /**
   * Render nodes
   */
  renderNodes(
    nodes: Node[], 
    hoveredNodeId: string | null, 
    selectedNodeId: string | null, 
    searchQuery: string,
    zoom: number
  ): void {
    nodes.forEach(node => {
      const isHovered = hoveredNodeId === node.id;
      const isSelected = selectedNodeId === node.id;
      const isSearchMatch = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      this.ctx.beginPath();
      this.ctx.arc(node.x || 0, node.y || 0, isHovered ? 12 : 10, 0, Math.PI * 2);
      
      if (isSearchMatch) {
        this.ctx.fillStyle = this.isDark ? '#3b82f6' : '#2563eb';
      } else if (isSelected) {
        this.ctx.fillStyle = this.isDark ? '#8b5cf6' : '#7c3aed';
      } else {
        this.ctx.fillStyle = this.isDark ? '#6366f1' : '#4f46e5';
      }
      
      this.ctx.fill();
      
      if (isHovered || isSelected) {
        this.ctx.strokeStyle = this.isDark ? '#fff' : '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Render labels based on zoom level and state
      if (isHovered || isSelected || isSearchMatch || zoom > 1.5) {
        this.ctx.fillStyle = this.isDark ? '#fff' : '#000';
        this.ctx.font = '12px system-ui';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.label, node.x || 0, (node.y || 0) - 15);
      }
    });
  }
}

// Export singleton instances
export const graphSimulation = new GraphSimulation();