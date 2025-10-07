import { useState, useEffect, useCallback } from 'react';
import type { KnowledgeGraph, Node, Connection } from '@/types';
import { apiClient, generateId, StorageManager } from '@/utils';

/**
 * Custom hook for managing the knowledge graph state and operations
 */
export function useKnowledgeGraph() {
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], connections: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStrength, setFilterStrength] = useState(0);

  // Load saved graph on mount
  useEffect(() => {
    const savedGraph = StorageManager.loadGraph();
    if (savedGraph) {
      setGraph(savedGraph);
    }
  }, []);

  // Save graph when it changes
  useEffect(() => {
    if (graph.nodes.length > 0) {
      StorageManager.saveGraph(graph);
    }
  }, [graph]);

  /**
   * Add new content and extract concepts
   */
  const addContent = useCallback(async (content: string, type: 'note' | 'url' | 'file') => {
    try {
      // Extract concepts from content
      const { concepts } = await apiClient.extractConcepts(content);

      // Create new nodes
  const newNodes: Node[] = concepts.map((concept) => ({
        id: generateId(),
        label: concept,
        content,
        type,
        timestamp: Date.now(),
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        vx: 0,
        vy: 0
      }));

      const newConnections: Connection[] = [];

      // Find connections with existing nodes
      if (graph.nodes.length > 0) {
        const existingConcepts = graph.nodes.map(n => n.label);
        const connections = await apiClient.findConnections(existingConcepts, concepts);

        connections.forEach(conn => {
          const sourceNode = graph.nodes.find(n => 
            n.label.toLowerCase().includes(conn.existing?.toLowerCase() || '')
          );
          const targetNode = newNodes.find(n => 
            n.label.toLowerCase().includes(conn.new?.toLowerCase() || '')
          );
          
          if (sourceNode && targetNode) {
            const strength = Math.max(conn.strength ?? 0.1, 0.1);
            newConnections.push({
              source: sourceNode.id,
              target: targetNode.id,
              strength,
              reason: conn.reason,
              isSurprising: conn.surprising
            });
          }
        });
      }

      // Find internal connections within new nodes
      if (newNodes.length > 1) {
        const internalConnections = await apiClient.findInternalConnections(concepts);

        internalConnections.forEach(conn => {
          const node1 = newNodes.find(n => 
            n.label.toLowerCase().includes(conn.concept1?.toLowerCase() || '')
          );
          const node2 = newNodes.find(n => 
            n.label.toLowerCase().includes(conn.concept2?.toLowerCase() || '')
          );
          
          if (node1 && node2 && node1.id !== node2.id) {
            const strength = Math.max(conn.strength ?? 0.1, 0.1);
            newConnections.push({
              source: node1.id,
              target: node2.id,
              strength,
              reason: conn.reason,
              isSurprising: conn.surprising
            });
          }
        });
      }

      // Update graph
      setGraph(prev => ({
        nodes: [...prev.nodes, ...newNodes],
        connections: [...prev.connections, ...newConnections]
      }));

      return newNodes;
    } catch (error) {
      console.error('Failed to add content:', error);
      throw error;
    }
  }, [graph.nodes]);

  /**
   * Delete a node and its connections
   */
  const deleteNode = useCallback((nodeId: string) => {
    setGraph(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(
        c => c.source !== nodeId && c.target !== nodeId
      )
    }));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  /**
   * Update node position
   */
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === nodeId ? { ...n, x, y, vx: 0, vy: 0 } : n
      )
    }));
  }, []);

  /**
   * Clear all data
   */
  const clearGraph = useCallback(() => {
    setGraph({ nodes: [], connections: [] });
    setSelectedNode(null);
    StorageManager.clearAll();
  }, []);

  /**
   * Import graph data
   */
  const importGraph = useCallback((importedGraph: KnowledgeGraph) => {
    setGraph(importedGraph);
    setSelectedNode(null);
  }, []);

  /**
   * Get filtered connections based on strength
   */
  const filteredConnections = graph.connections.filter(c => c.strength >= filterStrength);

  /**
   * Get nodes that match search query
   */
  const searchMatchingNodes = graph.nodes.filter(node => 
    searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    // State
    graph,
    selectedNode,
    searchQuery,
    filterStrength,
    filteredConnections,
    searchMatchingNodes,
    
    // Actions
    setSelectedNode,
    setSearchQuery,
    setFilterStrength,
    addContent,
    deleteNode,
    updateNodePosition,
    clearGraph,
    importGraph,
  };
}