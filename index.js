import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Upload, Sparkles, Settings, Download, Moon, Sun, Monitor, Plus, X, Trash2, Eye, Filter, Zap } from 'lucide-react';

// Knowledge Graph Data Structure
interface Node {
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

interface Connection {
  source: string;
  target: string;
  strength: number;
  reason: string;
  isSurprising: boolean;
}

interface KnowledgeGraph {
  nodes: Node[];
  connections: Connection[];
}

// API Configuration
interface APIConfig {
  provider: 'claude' | 'openai' | 'custom';
  apiKey: string;
  baseUrl?: string;
}

const ContextCollapse = () => {
  // State Management
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], connections: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCustomAPI, setUseCustomAPI] = useState(false);
  const [apiConfig, setAPIConfig] = useState<APIConfig>({
    provider: 'claude',
    apiKey: '',
    baseUrl: ''
  });
  const [filterStrength, setFilterStrength] = useState(0);
  const [serendipityIdeas, setSerendipityIdeas] = useState<string[]>([]);
  const [showSerendipity, setShowSerendipity] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Theme Management
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('context-collapse-graph');
    const hasSeenWelcome = localStorage.getItem('context-collapse-welcome');
    
    if (saved) {
      try {
        setGraph(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved graph', e);
      }
    }
    
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }

    const savedAPI = localStorage.getItem('context-collapse-api');
    if (savedAPI) {
      try {
        const config = JSON.parse(savedAPI);
        setAPIConfig(config);
        setUseCustomAPI(!!config.apiKey);
      } catch (e) {
        console.error('Failed to load API config', e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    if (graph.nodes.length > 0) {
      localStorage.setItem('context-collapse-graph', JSON.stringify(graph));
    }
  }, [graph]);

  // API Helper
  const callLLM = async (prompt: string): Promise<string> => {
    const config = useCustomAPI && apiConfig.apiKey ? apiConfig : null;
    
    if (!config && !useCustomAPI) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    }

    if (config?.provider === 'claude') {
      const response = await fetch(config.baseUrl || 'https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } else {
      const response = await fetch(
        config?.baseUrl || 'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config?.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  };

  // Process content and build graph
  const processContent = async (content: string, type: 'note' | 'url' | 'file', label: string) => {
    setIsProcessing(true);
    try {
      const extractPrompt = `Analyze this content and extract 3-7 key concepts or themes. Return ONLY a JSON array of strings, nothing else.

Content: ${content.substring(0, 3000)}

Return format: ["concept1", "concept2", "concept3"]`;

      const conceptsResponse = await callLLM(extractPrompt);
      const concepts = JSON.parse(conceptsResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      const newNodes: Node[] = concepts.map((concept: string, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        label: concept,
        content: content,
        type,
        timestamp: Date.now(),
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        vx: 0,
        vy: 0
      }));

      const newConnections: Connection[] = [];

      if (graph.nodes.length > 0) {
        const connectionPrompt = `Given these existing concepts: ${graph.nodes.map(n => n.label).join(', ')}

And these new concepts: ${concepts.join(', ')}

Find surprising and non-obvious connections between them. Focus on unexpected relationships, not obvious ones.

Return ONLY a JSON array of connections in this exact format:
[
  {
    "existing": "existing concept name",
    "new": "new concept name", 
    "strength": 0.5,
    "reason": "brief explanation",
    "surprising": true
  }
]

Return at least 5 connections, prioritizing surprising ones. Return ONLY valid JSON, no other text.`;

        const connectionsResponse = await callLLM(connectionPrompt);
        const suggestedConnections = JSON.parse(connectionsResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

        suggestedConnections.forEach((conn: any) => {
          const sourceNode = graph.nodes.find(n => n.label.toLowerCase().includes(conn.existing.toLowerCase()));
          const targetNode = newNodes.find(n => n.label.toLowerCase().includes(conn.new.toLowerCase()));
          
          if (sourceNode && targetNode) {
            newConnections.push({
              source: sourceNode.id,
              target: targetNode.id,
              strength: conn.strength,
              reason: conn.reason,
              isSurprising: conn.surprising
            });
          }
        });
      }

      if (newNodes.length > 1) {
        const internalConnectionPrompt = `Given these concepts from the same content: ${concepts.join(', ')}

Find connections between these concepts. They are from the same source, so look for how they relate to each other.

Return ONLY a JSON array of connections in this exact format:
[
  {
    "concept1": "first concept name",
    "concept2": "second concept name", 
    "strength": 0.5,
    "reason": "brief explanation",
    "surprising": false
  }
]

Return at least 3 connections. Return ONLY valid JSON, no other text.`;

        const internalResponse = await callLLM(internalConnectionPrompt);
        const internalConnections = JSON.parse(internalResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

        internalConnections.forEach((conn: any) => {
          const node1 = newNodes.find(n => n.label.toLowerCase().includes(conn.concept1.toLowerCase()));
          const node2 = newNodes.find(n => n.label.toLowerCase().includes(conn.concept2.toLowerCase()));
          
          if (node1 && node2 && node1.id !== node2.id) {
            newConnections.push({
              source: node1.id,
              target: node2.id,
              strength: conn.strength,
              reason: conn.reason,
              isSurprising: conn.surprising
            });
          }
        });
      }

      setGraph(prev => ({
        nodes: [...prev.nodes, ...newNodes],
        connections: [...prev.connections, ...newConnections]
      }));

      setShowUpload(false);
    } catch (error) {
      console.error('Failed to process content:', error);
      alert('Failed to process content. Please check your API configuration.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content = '';
      
      if (file.type === 'application/pdf') {
        const text = await file.text();
        content = text;
      } else {
        content = await file.text();
      }

      await processContent(content, 'file', file.name);
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('Failed to read file');
    }
  };

  // Handle URL import
  const handleURLImport = async (url: string) => {
    setIsProcessing(true);
    try {
      if (url.includes('docs.google.com')) {
        const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (docId) {
          url = `https://docs.google.com/document/d/${docId}/export?format=txt`;
        }
      }

      const response = await fetch(url);
      const content = await response.text();
      await processContent(content, 'url', url);
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      alert('Failed to fetch URL. Make sure it is publicly accessible.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate serendipity suggestions
  const generateSerendipity = async () => {
    if (graph.nodes.length < 3) {
      alert('Add more content to discover serendipitous connections!');
      return;
    }

    setIsProcessing(true);
    try {
      const prompt = `Given these concepts in a knowledge graph: ${graph.nodes.map(n => n.label).join(', ')}

Generate 5 creative ideas by combining unexpected concepts. Focus on:
- Novel intersections that have not been explored
- Surprising combinations
- Actionable project ideas
- Creative synthesis

Return ONLY a JSON array of strings, each being one creative idea:
["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]`;

      const response = await callLLM(prompt);
      const ideas = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      setSerendipityIdeas(ideas);
      setShowSerendipity(true);
    } catch (error) {
      console.error('Failed to generate serendipity:', error);
      alert('Failed to generate ideas');
    } finally {
      setIsProcessing(false);
    }
  };

  // Force-directed graph simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasSize.width;
    const height = canvasSize.height;

    const simulate = () => {
      const alpha = 0.3;
      const repulsion = 5000;
      const attraction = 0.01;
      const damping = 0.8;

      graph.nodes.forEach((node1, i) => {
        graph.nodes.forEach((node2, j) => {
          if (i >= j) return;
          
          const dx = (node2.x || 0) - (node1.x || 0);
          const dy = (node2.y || 0) - (node1.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          node1.vx = (node1.vx || 0) - fx * alpha;
          node1.vy = (node1.vy || 0) - fy * alpha;
          node2.vx = (node2.vx || 0) + fx * alpha;
          node2.vy = (node2.vy || 0) + fy * alpha;
        });
      });

      graph.connections.forEach(conn => {
        const source = graph.nodes.find(n => n.id === conn.source);
        const target = graph.nodes.find(n => n.id === conn.target);
        
        if (source && target) {
          const dx = (target.x || 0) - (source.x || 0);
          const dy = (target.y || 0) - (source.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = dist * attraction * conn.strength;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          source.vx = (source.vx || 0) + fx;
          source.vy = (source.vy || 0) + fy;
          target.vx = (target.vx || 0) - fx;
          target.vy = (target.vy || 0) - fy;
        }
      });

      graph.nodes.forEach(node => {
        if (node.id !== draggedNode) {
          node.x = (node.x || 0) + (node.vx || 0);
          node.y = (node.y || 0) + (node.vy || 0);
          node.vx = (node.vx || 0) * damping;
          node.vy = (node.vy || 0) * damping;
        }
      });

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      graph.connections.forEach(conn => {
        if (conn.strength < filterStrength) return;
        
        const source = graph.nodes.find(n => n.id === conn.source);
        const target = graph.nodes.find(n => n.id === conn.target);
        
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x || 0, source.y || 0);
          ctx.lineTo(target.x || 0, target.y || 0);
          
          if (conn.isSurprising) {
            ctx.strokeStyle = actualTheme === 'dark' ? '#fbbf24' : '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
          } else {
            ctx.strokeStyle = actualTheme === 'dark' ? '#4b5563' : '#d1d5db';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
          }
          
          ctx.globalAlpha = conn.strength;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      graph.nodes.forEach(node => {
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isSearchMatch = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
        
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, isHovered ? 12 : 10, 0, Math.PI * 2);
        
        if (isSearchMatch) {
          ctx.fillStyle = actualTheme === 'dark' ? '#3b82f6' : '#2563eb';
        } else if (isSelected) {
          ctx.fillStyle = actualTheme === 'dark' ? '#8b5cf6' : '#7c3aed';
        } else {
          ctx.fillStyle = actualTheme === 'dark' ? '#6366f1' : '#4f46e5';
        }
        
        ctx.fill();
        
        if (isHovered || isSelected) {
          ctx.strokeStyle = actualTheme === 'dark' ? '#fff' : '#000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (isHovered || isSelected || isSearchMatch || zoom > 1.5) {
          ctx.fillStyle = actualTheme === 'dark' ? '#fff' : '#000';
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x || 0, (node.y || 0) - 15);
        }
      });

      ctx.restore();
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graph, hoveredNode, selectedNode, searchQuery, filterStrength, zoom, pan, actualTheme, draggedNode, canvasSize]);

  // Canvas interaction handlers
  const getNodeAtPosition = (x: number, y: number): Node | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = (x - rect.left - canvasSize.width / 2 - pan.x) / zoom;
    const canvasY = (y - rect.top - canvasSize.height / 2 - pan.y) / zoom;

    return graph.nodes.find(node => {
      const dx = (node.x || 0) - canvasX;
      const dy = (node.y || 0) - canvasY;
      return Math.sqrt(dx * dx + dy * dy) < 12;
    }) || null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      setDraggedNode(node.id);
      setSelectedNode(node);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setPopupPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    } else {
      setIsDraggingCanvas(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
      setPopupPosition(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    setHoveredNode(node?.id || null);

    if (draggedNode) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - canvasSize.width / 2 - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - canvasSize.height / 2 - pan.y) / zoom;

      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === draggedNode 
            ? { ...n, x: canvasX, y: canvasY, vx: 0, vy: 0 }
            : n
        )
      }));
      
      if (popupPosition) {
        setPopupPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    } else if (isDraggingCanvas) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedNode(null);
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
    }
  };

  // Export/Import
  const exportGraph = () => {
    const data = JSON.stringify(graph, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-collapse-${Date.now()}.json`;
    a.click();
  };

  const importGraph = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setGraph(imported);
      } catch (error) {
        alert('Failed to import graph');
      }
    };
    reader.readAsText(file);
  };

  const bgClass = actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = actualTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const cardClass = actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderClass = actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const inputClass = actualTheme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors`}>
      {/* Header */}
      <header className={`${cardClass} border-b ${borderClass} px-4 py-3 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <h1 className="text-xl font-bold hidden sm:block">Context Collapse</h1>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                title="Search for concepts in your knowledge graph - matching nodes will be highlighted in blue"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Add new content - upload files, paste URLs, or add notes"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={generateSerendipity}
              disabled={isProcessing}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Generate creative ideas from unexpected concept combinations"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowWelcome(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Show help and tutorial"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Open settings - configure theme, API, and manage data"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Graph Canvas */}
        <div className="flex-1 p-4 lg:p-8">
          <div 
            ref={containerRef}
            className={`w-full h-full rounded-xl shadow-lg border-2 ${
              actualTheme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
            } relative overflow-hidden`}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full h-full cursor-move"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleWheel}
            />

            {/* Graph Controls */}
            <div className={`absolute top-4 left-4 ${cardClass} rounded-lg p-3 shadow-lg border ${borderClass}`}>
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium" title="Current zoom level - scroll with Cmd/Ctrl to zoom">
                  Zoom: {zoom.toFixed(1)}x
                </div>
                <div className="text-sm" title="Total number of concepts in your knowledge graph">
                  Nodes: {graph.nodes.length}
                </div>
                <div className="text-sm" title="Number of visible connections based on filter strength">
                  Connections: {graph.connections.filter(c => c.strength >= filterStrength).length}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Filter 
                    className="w-4 h-4" 
                    title="Filter connections by strength - slide right to show only strong connections"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filterStrength}
                    onChange={(e) => setFilterStrength(parseFloat(e.target.value))}
                    className="w-20"
                    title={`Filter strength: ${filterStrength.toFixed(1)} - Move right to hide weaker connections`}
                  />
                </div>
              </div>
            </div>

            {/* Node Popup */}
            {selectedNode && popupPosition && (
              <div 
                className={`absolute ${cardClass} rounded-lg p-4 shadow-xl border ${borderClass} max-w-sm z-10`}
                style={{
                  left: `${Math.min(popupPosition.x + 20, canvasSize.width - 300)}px`,
                  top: `${Math.min(popupPosition.y, canvasSize.height - 200)}px`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-sm">{selectedNode.label}</h3>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      setPopupPosition(null);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 mb-2">Connections</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {graph.connections
                    .filter(c => c.source === selectedNode.id || c.target === selectedNode.id)
                    .slice(0, 3)
                    .map((conn, idx) => {
                      const otherNodeId = conn.source === selectedNode.id ? conn.target : conn.source;
                      const otherNode = graph.nodes.find(n => n.id === otherNodeId);
                      return (
                        <div key={idx} className="text-xs">
                          <div className="font-medium flex items-center gap-1">
                            {otherNode?.label}
                            {conn.isSurprising && <Sparkles className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <div className="text-gray-500 truncate">{conn.reason}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Zoom Hint */}
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 ${
              actualTheme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
            } rounded-full shadow-md border ${borderClass} text-xs text-gray-600 dark:text-gray-400`}>
              <span className="hidden sm:inline">Hold </span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <span className="hidden sm:inline"> + </span>
              <span className="sm:hidden">+</span>
              <span>Scroll to zoom</span>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <div className={`${cardClass} rounded-lg p-6 shadow-xl`}>
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <div className="text-sm">Processing...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel Below Graph */}
        {selectedNode && (
          <div className={`${cardClass} border-t ${borderClass} p-6 overflow-y-auto max-h-80`}>
            <h2 className="text-xl font-bold mb-4">{selectedNode.label}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Type</div>
                  <div className="capitalize">{selectedNode.type}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Added</div>
                  <div>{new Date(selectedNode.timestamp).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Content Preview</div>
                <div className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-32 overflow-y-auto">
                  {selectedNode.content.substring(0, 500)}...
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">All Connections</div>
                <div className="space-y-2">
                  {graph.connections
                    .filter(c => c.source === selectedNode.id || c.target === selectedNode.id)
                    .map((conn, idx) => {
                      const otherNodeId = conn.source === selectedNode.id ? conn.target : conn.source;
                      const otherNode = graph.nodes.find(n => n.id === otherNodeId);
                      return (
                        <div key={idx} className={`p-2 rounded border ${borderClass} text-sm`}>
                          <div className="font-medium flex items-center gap-2">
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
                </div>
              </div>

              <button
                onClick={() => {
                  setGraph(prev => ({
                    ...prev,
                    nodes: prev.nodes.filter(n => n.id !== selectedNode.id),
                    connections: prev.connections.filter(
                      c => c.source !== selectedNode.id && c.target !== selectedNode.id
                    )
                  }));
                  setSelectedNode(null);
                  setPopupPosition(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Node
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${cardClass} rounded-lg p-6 max-w-md w-full shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Content</h2>
              <button onClick={() => setShowUpload(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload File</label>
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  onChange={handleFileUpload}
                  className="w-full"
                  disabled={isProcessing}
                  title="Upload text files, Markdown, or PDFs to extract concepts"
                />
                <p className="text-xs text-gray-500 mt-1">Supports .txt, .md, .pdf</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Or paste URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={`w-full px-3 py-2 rounded border ${inputClass}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleURLImport(e.currentTarget.value);
                    }
                  }}
                  disabled={isProcessing}
                  title="Paste a public URL - works with Google Docs, articles, websites"
                />
                <p className="text-xs text-gray-500 mt-1">Public Google Docs, websites, articles</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Or paste text</label>
                <textarea
                  placeholder="Paste your notes here..."
                  rows={6}
                  className={`w-full px-3 py-2 rounded border ${inputClass} resize-none`}
                  disabled={isProcessing}
                  id="pasteArea"
                  title="Paste any text content - notes, articles, thoughts"
                />
                <button
                  onClick={() => {
                    const textarea = document.getElementById('pasteArea') as HTMLTextAreaElement;
                    if (textarea.value) {
                      processContent(textarea.value, 'note', 'Pasted Note');
                      textarea.value = '';
                    }
                  }}
                  disabled={isProcessing}
                  className="mt-2 w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                  title="Add this note to your knowledge graph"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`${cardClass} rounded-lg p-6 max-w-2xl w-full shadow-xl my-8`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Theme</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      theme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' : borderClass
                    }`}
                    title="Use light theme"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' : borderClass
                    }`}
                    title="Use dark theme"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      theme === 'system' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' : borderClass
                    }`}
                    title="Match system theme preference"
                  >
                    <Monitor className="w-4 h-4" />
                    System
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">API Configuration</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomAPI}
                      onChange={(e) => setUseCustomAPI(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Use custom API</span>
                  </label>
                </div>

                {useCustomAPI && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-1">Provider</label>
                      <select
                        value={apiConfig.provider}
                        onChange={(e) => setAPIConfig({ ...apiConfig, provider: e.target.value as any })}
                        className={`w-full px-3 py-2 rounded border ${inputClass}`}
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
                        onChange={(e) => setAPIConfig({ ...apiConfig, apiKey: e.target.value })}
                        placeholder="sk-..."
                        className={`w-full px-3 py-2 rounded border ${inputClass}`}
                      />
                    </div>

                    {apiConfig.provider === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Base URL</label>
                        <input
                          type="url"
                          value={apiConfig.baseUrl}
                          onChange={(e) => setAPIConfig({ ...apiConfig, baseUrl: e.target.value })}
                          placeholder="https://api.example.com/v1/chat/completions"
                          className={`w-full px-3 py-2 rounded border ${inputClass}`}
                        />
                      </div>
                    )}

                    <button
                      onClick={() => {
                        localStorage.setItem('context-collapse-api', JSON.stringify(apiConfig));
                        alert('API configuration saved');
                      }}
                      className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    >
                      Save API Config
                    </button>
                  </div>
                )}

                {!useCustomAPI && (
                  <p className="text-sm text-gray-500">Using default API from environment</p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-3">Data Management</h3>
                <div className="space-y-2">
                  <button
                    onClick={exportGraph}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Download your knowledge graph as JSON file for backup"
                  >
                    <Download className="w-4 h-4" />
                    Export Graph
                  </button>

                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    title="Import a previously exported knowledge graph"
                  >
                    <Upload className="w-4 h-4" />
                    Import Graph
                    <input
                      type="file"
                      accept=".json"
                      onChange={importGraph}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (confirm('Delete all data? This cannot be undone.')) {
                        setGraph({ nodes: [], connections: [] });
                        localStorage.removeItem('context-collapse-graph');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    title="Permanently delete all nodes and connections"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Data
                  </button>
                </div>
              </div>

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
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>Unexpected relationship</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Serendipity Modal */}
      {showSerendipity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${cardClass} rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                Serendipitous Ideas
              </h2>
              <button onClick={() => setShowSerendipity(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Creative combinations from your knowledge graph
            </p>

            <div className="space-y-3">
              {serendipityIdeas.map((idea, idx) => (
                <div key={idx} className={`p-4 border rounded-lg ${borderClass} hover:border-indigo-500 transition-colors`}>
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
              onClick={generateSerendipity}
              disabled={isProcessing}
              className="mt-4 w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              Generate More Ideas
            </button>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${cardClass} rounded-lg p-6 max-w-lg w-full shadow-xl`}>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-indigo-500" />
              <h2 className="text-2xl font-bold">Welcome to Context Collapse</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your second brain that actually connects the dots
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Add Your Knowledge</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload files, paste URLs, or add notes. AI extracts key concepts automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Discover Surprising Connections</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI finds non-obvious relationships between your ideas, shown as dashed yellow lines.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Generate Serendipitous Ideas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the lightning bolt to get creative project ideas from unexpected combinations.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Explore Your Graph</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click nodes to see details. Drag to rearrange. Hold Cmd/Ctrl + Scroll to zoom. Use the filter to hide weak connections.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-4`}>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> For the best experience, add diverse content from different domains. The magic happens when AI connects seemingly unrelated ideas!
              </p>
            </div>

            <button
              onClick={() => {
                setShowWelcome(false);
                localStorage.setItem('context-collapse-welcome', 'true');
                setShowUpload(true);
              }}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Get Started
            </button>

            <button
              onClick={() => {
                setShowWelcome(false);
                localStorage.setItem('context-collapse-welcome', 'true');
              }}
              className="w-full mt-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Skip Tutorial
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextCollapse;