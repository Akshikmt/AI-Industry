import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum
} from 'd3-force';
import {
  Loader2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  BookOpen,
  User,
  Clock,
  Briefcase,
  Search,
  Maximize2,
  Layers,
  Building2,
  FileText,
  Activity,
  Bot,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: 'department' | 'user' | 'asset' | 'document' | 'log';
  val: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

const GraphPage: React.FC = () => {
  const navigate = useNavigate();

  // Raw API data
  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawLinks, setRawLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Physics Coordinates
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  // Selection & Interactions
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTypes, setVisibleTypes] = useState({
    department: true,
    user: true,
    asset: true,
    document: true,
    log: true
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<any>(null);

  // Fetch API graph data
  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/graph');
      setRawNodes(data.nodes || []);
      setRawLinks(data.links || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve relations network.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  // Industrial Node Styling System
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'department': return '#8B5CF6'; // Purple - Organizational Unit
      case 'user': return '#F59E0B';       // Amber - Personnel / Operators
      case 'asset': return '#10B981';      // Emerald - Machinery & Equipment
      case 'document': return '#3B82F6';   // Blue - SOP Manuals & Standards
      case 'log': return '#EF4444';        // Rose Red - Alarms & Incidents
      default: return '#64748B';
    }
  };

  const getNodeRadius = (type: string, val = 1) => {
    switch (type) {
      case 'department': return 22;
      case 'asset': return 18 + val * 1.5;
      case 'user': return 16;
      case 'document': return 16;
      case 'log': return 14;
      default: return 14;
    }
  };

  // Filter raw data according to active layers
  const filteredData = useMemo(() => {
    const activeNodes: GraphNode[] = rawNodes
      .filter(n => visibleTypes[n.type as keyof typeof visibleTypes])
      .map(n => ({ ...n }));

    const activeNodeIds = new Set(activeNodes.map(n => n.id));

    const activeLinks: GraphLink[] = rawLinks
      .filter(l => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return activeNodeIds.has(srcId) && activeNodeIds.has(tgtId);
      })
      .map(l => ({ ...l }));

    return { nodes: activeNodes, links: activeLinks };
  }, [rawNodes, rawLinks, visibleTypes]);

  // Layer Counts
  const layerCounts = useMemo(() => {
    const counts = { department: 0, user: 0, asset: 0, document: 0, log: 0 };
    rawNodes.forEach(n => {
      if (counts[n.type as keyof typeof counts] !== undefined) {
        counts[n.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [rawNodes]);

  // D3 Force Layout Engine
  useEffect(() => {
    if (filteredData.nodes.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    const width = 800;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;

    const simNodes: GraphNode[] = filteredData.nodes.map((n, i) => {
      const existing = nodes.find(old => old.id === n.id);
      if (existing && existing.x !== undefined && existing.y !== undefined) {
        return { ...n, x: existing.x, y: existing.y, vx: existing.vx || 0, vy: existing.vy || 0 };
      }
      const angle = (i / filteredData.nodes.length) * 2 * Math.PI;
      const radius = 170 + Math.random() * 80;
      return {
        ...n,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    const simLinks: GraphLink[] = filteredData.links.map(l => ({ ...l }));

    if (simRef.current) simRef.current.stop();

    const sim = forceSimulation<GraphNode>(simNodes)
      .force('charge', forceManyBody<GraphNode>().strength(-350).distanceMax(500))
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(simLinks)
          .id(d => d.id)
          .distance(l => (l.label === 'mentions' ? 130 : 105))
          .strength(0.4)
      )
      .force('center', forceCenter(centerX, centerY).strength(0.08))
      .force('x', forceX(centerX).strength(0.08))
      .force('y', forceY(centerY).strength(0.08))
      .force(
        'collide',
        forceCollide<GraphNode>()
          .radius(n => getNodeRadius(n.type, n.val) + 32)
          .iterations(3)
      )
      .alphaDecay(0.025);

    sim.on('tick', () => {
      setNodes([...simNodes]);
      setLinks([...simLinks]);
    });

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [filteredData]);

  // Restart physics relaxation
  const handleResetPhysics = () => {
    if (simRef.current) {
      simRef.current.alpha(1).restart();
    }
  };

  // Zoom to Fit Graph View
  const handleZoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    nodes.forEach(n => {
      if (n.x !== undefined && n.y !== undefined) {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      }
    });

    if (minX === Infinity) return;

    const padding = 80;
    const graphWidth = Math.max(maxX - minX, 200);
    const graphHeight = Math.max(maxY - minY, 200);
    const canvasWidth = 800;
    const canvasHeight = 580;

    const scaleX = (canvasWidth - padding * 2) / graphWidth;
    const scaleY = (canvasHeight - padding * 2) / graphHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.6);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newTransX = canvasWidth / 2 - centerX * newZoom;
    const newTransY = canvasHeight / 2 - centerY * newZoom;

    setZoom(newZoom);
    setTranslate({ x: newTransX, y: newTransY });
  }, [nodes]);

  // Check 1-hop connected nodes for clean highlight
  const activeFocusNode = hoveredNode || selectedNode;

  const isConnected = useCallback((nodeId: string) => {
    if (!activeFocusNode) return true;
    if (activeFocusNode.id === nodeId) return true;
    return links.some(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return (srcId === activeFocusNode.id && tgtId === nodeId) ||
             (tgtId === activeFocusNode.id && srcId === nodeId);
    });
  }, [activeFocusNode, links]);

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const set = new Set<string>();
    nodes.forEach(n => {
      if (n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)) {
        set.add(n.id);
      }
    });
    return set;
  }, [searchQuery, nodes]);

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (draggedNode && simRef.current) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - translate.x) / zoom;
      const y = (e.clientY - rect.top - translate.y) / zoom;

      draggedNode.fx = x;
      draggedNode.fy = y;
      simRef.current.alphaTarget(0.2).restart();
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      setDraggedNode(null);
      if (simRef.current) simRef.current.alphaTarget(0);
    }
  };

  // Scroll wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.8);
    setZoom(newZoom);
  };

  // Node Drag Start
  const handleNodeMouseDown = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNode(node);
    setSelectedNode(node);
    if (simRef.current) {
      simRef.current.alphaTarget(0.3).restart();
    }
  };

  // Get connected nodes list for Inspector Drawer
  const getConnectedNodes = () => {
    if (!selectedNode) return [];
    return links
      .filter(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return (srcId === selectedNode.id || tgtId === selectedNode.id);
      })
      .map(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        const otherId = srcId === selectedNode.id ? tgtId : srcId;
        const nodeObj = nodes.find(n => n.id === otherId);
        return { node: nodeObj, relation: l.label };
      })
      .filter(item => item.node !== undefined) as { node: GraphNode; relation: string }[];
  };

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-sans tracking-tight">
              Knowledge Graph Explorer
            </h1>
            <span className="text-xs text-accent-teal font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
              Industrial RAG Relations
            </span>
          </div>
          <p className="text-xs text-dark-muted mt-1">
            Map relationships between equipment tags, SOP manuals, field technicians, and incident alarms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-dark-border bg-dark-card text-xs">
            <span className="text-dark-muted font-medium">Entities: <strong className="text-white font-bold">{nodes.length}</strong></span>
            <span className="text-dark-border">|</span>
            <span className="text-dark-muted font-medium">Relations: <strong className="text-accent-teal font-bold">{links.length}</strong></span>
          </div>

          <button
            onClick={fetchGraphData}
            className="p-2 rounded-lg border border-dark-border bg-dark-card hover:border-accent-teal/50 text-dark-muted hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs"
            title="Reload graph data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-accent-teal" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Unified Clean Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glassmorphism p-4 rounded-xl space-y-4 shadow-xs">
            
            {/* Search Input */}
            <div className="space-y-2">
              <label className="font-bold text-xs uppercase tracking-wider text-dark-muted flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-accent-teal" />
                  Search Tags & SOPs
                </span>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[10px] text-accent-rose hover:underline">
                    Clear
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tag P-101, Manual, Operator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-dark-border bg-dark-bg text-dark-text placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-accent-teal transition-all"
                />
                <Search className="w-3.5 h-3.5 text-dark-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Layer Filters */}
            <div className="pt-2 border-t border-dark-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent-teal" />
                  Graph Layers
                </span>
                <button
                  onClick={() => setVisibleTypes({ department: true, user: true, asset: true, document: true, log: true })}
                  className="text-[10px] text-dark-muted hover:text-accent-teal font-semibold"
                >
                  Show All
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'asset', label: 'Equipment Tags', count: layerCounts.asset, color: '#10B981' },
                  { key: 'document', label: 'SOP Manuals', count: layerCounts.document, color: '#3B82F6' },
                  { key: 'user', label: 'Operators & Staff', count: layerCounts.user, color: '#F59E0B' },
                  { key: 'log', label: 'Incident Alarms', count: layerCounts.log, color: '#EF4444' },
                  { key: 'department', label: 'Departments', count: layerCounts.department, color: '#8B5CF6' },
                ].map(({ key, label, count, color }) => {
                  const isChecked = visibleTypes[key as keyof typeof visibleTypes];

                  return (
                    <label
                      key={key}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-dark-border bg-dark-card/90 hover:border-accent-teal/40'
                          : 'border-transparent bg-dark-bg/40 opacity-50 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setVisibleTypes(prev => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof visibleTypes]
                          }))}
                          className="rounded border-dark-border text-accent-teal bg-dark-bg focus:ring-accent-teal w-4 h-4 cursor-pointer"
                        />
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color }} />
                        <span className="text-xs font-bold text-dark-text">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-dark-muted font-mono">
                        ({count})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Layout Action Buttons */}
            <div className="pt-2 border-t border-dark-border/60 flex items-center gap-2">
              <button
                onClick={handleZoomToFit}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-lg border border-dark-border bg-dark-card hover:bg-dark-border/50 text-white transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Maximize2 className="w-3.5 h-3.5 text-accent-teal" />
                Fit View
              </button>
              <button
                onClick={handleResetPhysics}
                className="py-2 px-3 text-xs font-bold rounded-lg border border-dark-border bg-dark-card hover:bg-dark-border/50 text-dark-muted hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-xs"
                title="Reset layout physics"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>

          </div>
        </div>

        {/* Center Canvas Area */}
        <div className="lg:col-span-3 glassmorphism rounded-xl relative border border-dark-border overflow-hidden h-[600px] bg-dark-bg/90 flex flex-col shadow-lg">

          {/* Canvas Navigation Toolbar */}
          <div className="absolute top-4 left-4 z-30 flex flex-col gap-1.5">
            <button
              onClick={() => setZoom(z => Math.min(2.8, z + 0.2))}
              className="p-2 rounded-lg bg-dark-card/90 hover:bg-dark-card border border-dark-border text-white transition-all shadow-md active:scale-95"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              className="p-2 rounded-lg bg-dark-card/90 hover:bg-dark-card border border-dark-border text-white transition-all shadow-md active:scale-95"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomToFit}
              className="p-2 rounded-lg bg-dark-card/90 hover:bg-dark-card border border-dark-border text-white transition-all shadow-md active:scale-95"
              title="Fit Graph to Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Hover Summary Banner (Top Right of Canvas) */}
          {hoveredNode && !selectedNode && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-dark-card/95 border border-dark-border shadow-xl backdrop-blur-md animate-fade-in pointer-events-none">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: getNodeColor(hoveredNode.type) }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs">{hoveredNode.label}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: getNodeColor(hoveredNode.type) }}
                    >
                      • {hoveredNode.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-dark-muted block">Click to inspect relations & details</span>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-dark-muted bg-dark-bg/60 backdrop-blur-xs z-40">
              <Loader2 className="w-9 h-9 animate-spin text-accent-teal" />
              <p className="text-xs mt-3 font-bold text-white">Compiling Industrial Knowledge Graph...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-accent-rose gap-2 bg-dark-bg/80 z-40">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">{error}</span>
            </div>
          ) : (
            <svg
              ref={svgRef}
              id="canvas-bg"
              className={`w-full h-full select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onClick={() => { setSelectedNode(null); setHoveredNode(null); }}
            >
              <defs>
                <pattern id="graph-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="var(--color-dark-border)" opacity="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#graph-grid)" pointerEvents="none" />

              <g transform={`translate(${translate.x}, ${translate.y}) scale(${zoom})`}>

                {/* EDGES / RELATIONSHIP LINES */}
                {links.map((link, idx) => {
                  const sourceNode = typeof link.source === 'object' ? (link.source as GraphNode) : nodes.find(n => n.id === link.source);
                  const targetNode = typeof link.target === 'object' ? (link.target as GraphNode) : nodes.find(n => n.id === link.target);

                  if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) {
                    return null;
                  }

                  const isSrcConnected = isConnected(sourceNode.id);
                  const isTgtConnected = isConnected(targetNode.id);
                  const isHighlighted = (activeFocusNode && isSrcConnected && isTgtConnected);
                  const isDashed = link.label === 'mentions';

                  const midX = (sourceNode.x + targetNode.x) / 2;
                  const midY = (sourceNode.y + targetNode.y) / 2;

                  return (
                    <g key={`link-${idx}`}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isHighlighted ? '#10B981' : '#334155'}
                        strokeWidth={isHighlighted ? 2.2 : 1.2}
                        strokeDasharray={isDashed ? '4 4' : 'none'}
                        strokeOpacity={activeFocusNode ? (isHighlighted ? 0.95 : 0.12) : 0.45}
                        className="transition-all duration-300"
                      />

                      {/* Sleek Professional Relation Micro-Badge */}
                      {isHighlighted && (
                        <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                          <rect
                            x={-(link.label.length * 3 + 6)}
                            y="-7"
                            width={link.label.length * 6 + 12}
                            height="14"
                            rx="3"
                            fill="var(--color-dark-card)"
                            stroke="var(--color-dark-border)"
                            strokeWidth="1"
                            opacity="0.95"
                          />
                          <text
                            textAnchor="middle"
                            dy="3"
                            fill="#10B981"
                            className="text-[9px] font-sans font-bold tracking-tight"
                          >
                            {link.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* GRAPH NODES */}
                {nodes.map(node => {
                  if (node.x === undefined || node.y === undefined) return null;

                  const color = getNodeColor(node.type);
                  const radius = getNodeRadius(node.type, node.val);
                  const isHighlighted = isConnected(node.id);
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNode?.id === node.id;
                  const isSearchMatch = searchMatches.has(node.id);

                  const opacity = activeFocusNode
                    ? (isHighlighted ? 1 : 0.2)
                    : (searchMatches.size > 0 ? (isSearchMatch ? 1 : 0.25) : 1);

                  return (
                    <g
                      key={`node-${node.id}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => handleNodeMouseDown(node, e)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                      className="cursor-pointer transition-opacity duration-300"
                      style={{ opacity }}
                    >
                      {/* Active / Hover Glowing Ring */}
                      {(isSelected || isHovered || isSearchMatch) && (
                        <circle
                          r={radius + 7}
                          fill="none"
                          stroke={color}
                          strokeWidth={isSelected ? "3" : "2"}
                          className={isSelected ? "animate-pulse" : ""}
                          strokeOpacity={0.8}
                        />
                      )}

                      {/* Node Circle Core */}
                      <circle
                        r={radius}
                        fill="var(--color-dark-card)"
                        stroke={color}
                        strokeWidth={isSelected ? 3.5 : 2}
                        className="transition-transform duration-200 hover:scale-110 shadow-lg"
                      />

                      {/* Inner Dot Indicator */}
                      <circle
                        r={radius * 0.4}
                        fill={color}
                        className="pointer-events-none"
                      />

                      {/* Crisp Label with Stroke Halo */}
                      <text
                        y={radius + 16}
                        textAnchor="middle"
                        fill={isSelected ? '#10B981' : (isSearchMatch ? '#F59E0B' : 'var(--color-dark-text)')}
                        style={{
                          paintOrder: 'stroke fill',
                          stroke: 'var(--color-dark-card)',
                          strokeWidth: '4px',
                          strokeLinejoin: 'round'
                        }}
                        className={`text-[10px] font-sans font-bold select-none pointer-events-none ${
                          isSelected ? 'font-extrabold scale-110' : ''
                        }`}
                      >
                        {node.label.length > 22 ? `${node.label.slice(0, 20)}...` : node.label}
                      </text>
                    </g>
                  );
                })}

              </g>
            </svg>
          )}

          {/* Actionable Inspector Drawer */}
          {selectedNode && (
            <div className="absolute right-4 top-4 bottom-4 w-80 bg-dark-card/95 border border-dark-border rounded-xl p-5 shadow-2xl z-40 flex flex-col justify-between overflow-hidden animate-slide-in backdrop-blur-md">
              <div className="space-y-4 overflow-y-auto pr-1">
                
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b border-dark-border">
                  <div>
                    <span
                      className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: getNodeColor(selectedNode.type) }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode.type) }} />
                      {selectedNode.type === 'log' ? 'Incident Alarm' : selectedNode.type}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5 leading-snug">
                      {selectedNode.label}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-lg border border-dark-border hover:border-accent-rose text-dark-muted hover:text-accent-rose transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Industrial Specifications & Direct Relations */}
                <div className="space-y-3.5 text-xs leading-relaxed">
                  
                  {selectedNode.type === 'asset' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-dark-muted font-bold text-[11px]">
                        <Briefcase className="w-3.5 h-3.5 text-accent-teal" />
                        <span>Equipment Tag Info</span>
                      </div>
                      <div className="p-3 rounded-lg bg-dark-bg/60 border border-dark-border/60 space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-dark-muted">Status:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Operational
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-muted">Monitoring:</span>
                          <span className="text-white font-semibold">Active AI Telemetry</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/copilot', { state: { query: `What are the maintenance procedures and specs for ${selectedNode.label}?` } })}
                        className="w-full py-2 px-3 bg-accent-teal/15 hover:bg-accent-teal/25 border border-accent-teal/40 text-accent-teal font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        Query Asset in AI Copilot
                      </button>
                    </div>
                  )}

                  {selectedNode.type === 'document' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-dark-muted font-bold text-[11px]">
                        <BookOpen className="w-3.5 h-3.5 text-accent-blue" />
                        <span>SOP Document Vector</span>
                      </div>
                      <div className="p-3 rounded-lg bg-dark-bg/60 border border-dark-border/60 text-[11px] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-dark-muted">RAG Status:</span>
                          <span className="text-accent-blue font-bold">Vectorized in DB</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/copilot', { state: { query: `Summarize key standard operating procedures in document: ${selectedNode.label}` } })}
                        className="w-full py-2 px-3 bg-accent-blue/15 hover:bg-accent-blue/25 border border-accent-blue/40 text-accent-blue font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        Query SOP in AI Copilot
                      </button>
                    </div>
                  )}

                  {selectedNode.type === 'log' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-accent-rose font-bold text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5 text-accent-rose" />
                        <span>Industrial Incident Log</span>
                      </div>
                      <p className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-[11px]">
                        Chronological maintenance/diagnostic alarm recorded in workspace audit logs.
                      </p>
                    </div>
                  )}

                  {/* Connected Relationships List */}
                  <div className="pt-3 border-t border-dark-border/60">
                    <span className="text-[10px] text-dark-muted font-extrabold uppercase tracking-wider block mb-2">
                      Connected Relations ({getConnectedNodes().length}):
                    </span>
                    <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      {getConnectedNodes().map(({ node, relation }, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedNode(node)}
                          className="w-full flex items-center justify-between p-2 rounded-lg border border-dark-border bg-dark-bg/40 hover:border-accent-teal/50 hover:bg-dark-bg transition-all text-left group"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: getNodeColor(node.type) }}
                            />
                            <div className="truncate">
                              <span className="text-[11px] font-semibold text-white group-hover:text-accent-teal truncate block">
                                {node.label}
                              </span>
                              <span className="text-[9px] text-dark-muted block font-mono">
                                relation: {relation}
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] capitalize text-dark-muted shrink-0 font-bold">
                            {node.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="w-full mt-4 py-2 border border-dark-border hover:bg-dark-border text-xs text-white font-bold rounded-lg transition-all text-center shrink-0 shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GraphPage;
