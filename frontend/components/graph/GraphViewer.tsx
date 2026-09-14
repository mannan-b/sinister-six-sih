"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape, { Core, EventObject } from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  Filter,
  Route, Search,
  Users2,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { GraphData, GraphNode, GraphEdge, ShortestPathResult } from "@/types";
import { cytoscapeStyles } from "@/lib/cytoscape-style";
import { findShortestPath } from "@/lib/api/graph";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

// Register layout extension safely on client
if (typeof window !== "undefined") {
  try {
    cytoscape.use(coseBilkent);
  } catch { }
}

interface GraphViewerProps {
  data: GraphData;
  onSelectNode: (node: GraphNode | null) => void;
  onSelectEdge?: (edge: GraphEdge | null) => void;
  highlightedNodeId?: string;
  caseId: string;
}

export function GraphViewer({
  data,
  onSelectNode,
  onSelectEdge,
  highlightedNodeId,
  caseId,
}: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [layoutName, setLayoutName] = useState<string>("cose");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [minRiskFilter, setMinRiskFilter] = useState<number>(0);

  // Shortest Path State
  const [showPathModal, setShowPathModal] = useState<boolean>(false);
  const [sourceNodeId, setSourceNodeId] = useState<string>("");
  const [targetNodeId, setTargetNodeId] = useState<string>("");
  const [pathResult, setPathResult] = useState<ShortestPathResult | null>(null);
  const [isCalculatingPath, setIsCalculatingPath] = useState<boolean>(false);

  // Show Legend & Controls Toggle
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Initialize Cytoscape Instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Convert data to Cytoscape format
    const elements: cytoscape.ElementDefinition[] = [];

    // Filter nodes
    const activeNodes = data.nodes.filter((node) => {
      if (selectedTypeFilter !== "ALL" && node.type !== selectedTypeFilter) return false;
      if (node.risk_score < minRiskFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          node.label.toLowerCase().includes(q) ||
          node.type.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));

    activeNodes.forEach((node) => {
      elements.push({
        group: "nodes",
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          risk_score: node.risk_score,
          risk_level: node.risk_level,
          community_id: node.community_id,
          degree: node.metrics?.degree || 0,
          betweenness: node.metrics?.betweenness || 0,
          pagerank: node.metrics?.pagerank || 0,
        },
        classes: node.community_id ? `community-${(node.community_id % 3) + 1}` : "",
      });
    });

    // Add edges connecting active nodes
    data.edges.forEach((edge) => {
      if (activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)) {
        elements.push({
          group: "edges",
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            relationship: edge.relationship,
            confidence: edge.confidence,
            weight: edge.weight,
          },
        });
      }
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: cytoscapeStyles,
      layout: {
        name: layoutName === "cose-bilkent" ? "cose-bilkent" : layoutName,
        animate: false,
        randomize: false,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 100,
        nodeRepulsion: 4500,
      } as any,
      minZoom: 0.2,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
    });

    // Event Handlers
    cy.on("tap", "node", (evt: EventObject) => {
      const node = evt.target;
      const rawNode = data.nodes.find((n) => n.id === node.id());
      if (rawNode) {
        onSelectNode(rawNode);
      }
    });

    cy.on("tap", "edge", (evt: EventObject) => {
      const edge = evt.target;
      const rawEdge = data.edges.find((e) => e.id === edge.id());
      if (rawEdge && onSelectEdge) {
        onSelectEdge(rawEdge);
      }
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        onSelectNode(null);
        if (onSelectEdge) onSelectEdge(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [data, layoutName, selectedTypeFilter, minRiskFilter, searchTerm, onSelectNode, onSelectEdge]);

  // Handle external highlight (e.g. from search or sidebar selection)
  useEffect(() => {
    if (!cyRef.current || !highlightedNodeId) return;
    const cy = cyRef.current;
    const targetNode = cy.$id(highlightedNodeId);
    if (targetNode.length > 0) {
      cy.elements().removeClass("highlighted dimmed");
      targetNode.addClass("highlighted");
      targetNode.neighborhood().addClass("highlighted");
      cy.elements().not(targetNode.closedNeighborhood()).addClass("dimmed");
      cy.animate({
        center: { eles: targetNode },
        zoom: 1.5,
        duration: 400,
      });
    }
  }, [highlightedNodeId]);

  // Graph Action Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleReset = () => {
    if (!cyRef.current) return;
    cyRef.current.elements().removeClass("highlighted dimmed path-node path-edge");
    cyRef.current.fit(undefined, 30);
    onSelectNode(null);
    setPathResult(null);
  };

  const handleShortestPath = async () => {
    if (!sourceNodeId || !targetNodeId || !caseId) return;
    setIsCalculatingPath(true);
    try {
      const res = await findShortestPath(caseId, sourceNodeId, targetNodeId);
      setPathResult(res);

      if (res.found && cyRef.current) {
        const cy = cyRef.current;
        cy.elements().removeClass("highlighted dimmed path-node path-edge");
        cy.elements().addClass("dimmed");

        res.path_nodes.forEach((nodeId) => {
          cy.$id(nodeId).removeClass("dimmed").addClass("path-node");
        });
        res.path_edges.forEach((edgeId) => {
          cy.$id(edgeId).removeClass("dimmed").addClass("path-edge");
        });

        const pathEles = cy.collection();
        res.path_nodes.forEach((nId) => pathEles.merge(cy.$id(nId)));
        cy.fit(pathEles, 60);
      }
    } catch {
      setPathResult({
        found: false,
        path_length: 0,
        path_nodes: [],
        path_edges: [],
        steps: [],
        explanation: "Error executing shortest path analysis.",
      });
    } finally {
      setIsCalculatingPath(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden select-none">
      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/90 backdrop-blur border border-zinc-800 rounded-lg p-1.5 shadow-xl">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter graph nodes..."
            className="pl-8 pr-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-white placeholder:text-zinc-500 w-48 transition-all"
          />
        </div>

        <select
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="cose">Force Layout (CoSE)</option>
          <option value="circle">Circle Layout</option>
          <option value="concentric">Concentric (Risk Centrality)</option>
          <option value="grid">Grid Layout</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded border text-xs flex items-center gap-1.5 transition-colors ${
            showFilters
              ? "bg-zinc-900 border-zinc-600 text-white"
              : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
          }`}
          title="Toggle Filters"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        <button
          onClick={() => setShowPathModal(!showPathModal)}
          className={`p-1.5 rounded border text-xs flex items-center gap-1.5 transition-colors ${
            showPathModal
              ? "bg-zinc-900 border-zinc-600 text-white"
              : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
          }`}
          title="Trace Connection Path"
        >
          <Route className="w-3.5 h-3.5 text-zinc-300" />
          <span>Shortest Path</span>
        </button>
      </div>

      {/* Floating Filter Drawer */}
      {showFilters && (
        <div className="absolute top-16 left-4 z-10 w-72 bg-black/95 backdrop-blur border border-zinc-800 rounded-lg p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-white">Graph Filters</span>
            <button
              onClick={() => {
                setSelectedTypeFilter("ALL");
                setMinRiskFilter(0);
                setSearchTerm("");
              }}
              className="text-[10px] text-zinc-400 hover:text-white hover:underline"
            >
              Reset Filters
            </button>
          </div>

          <div>
            <label className="text-[10px] uppercase text-zinc-400 block mb-1">
              Entity Type
            </label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
            >
              <option value="ALL">All Entity Types</option>
              <option value="PERSON">Persons</option>
              <option value="PHONE">Phones</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="LOCATION">Locations</option>
              <option value="BANK_ACCOUNT">Bank Accounts</option>
              <option value="ORGANIZATION">Organizations</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Min Risk Score</span>
              <span className="text-zinc-200 font-bold">{minRiskFilter}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minRiskFilter}
              onChange={(e) => setMinRiskFilter(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Shortest Path Modal */}
      {showPathModal && (
        <div className="absolute top-16 left-4 z-10 w-84 max-w-md bg-black/95 backdrop-blur border border-zinc-800 rounded-lg p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Route className="w-4 h-4" />
              <span>Trace Intermediary Connection</span>
            </div>
            <button
              onClick={() => setShowPathModal(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase text-zinc-400">Entity A (Source)</label>
              <select
                value={sourceNodeId}
                onChange={(e) => setSourceNodeId(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
              >
                <option value="">Select Starting Entity...</option>
                {data.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400">Entity B (Target)</label>
              <select
                value={targetNodeId}
                onChange={(e) => setTargetNodeId(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
              >
                <option value="">Select Target Entity...</option>
                {data.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={!sourceNodeId || !targetNodeId || isCalculatingPath}
              onClick={handleShortestPath}
              className="w-full mt-2 py-2 rounded bg-white hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold text-black transition-colors"
            >
              {isCalculatingPath ? "Calculating Shortest Path..." : "Find Connection Path"}
            </button>
          </div>

          {pathResult && (
            <div className="mt-3 p-3 rounded bg-zinc-900 border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span className={pathResult.found ? "text-white" : "text-zinc-400"}>
                  {pathResult.found ? `Path Found (${pathResult.path_length} Hops)` : "No Direct Path"}
                </span>
              </div>
              <MarkdownRenderer content={pathResult.explanation} className="text-[11px]" />
            </div>
          )}
        </div>
      )}

      {/* Floating Canvas Navigation Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 bg-black/90 backdrop-blur border border-zinc-800 rounded-lg p-1.5 shadow-xl">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Fit Graph"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Reset Graph & Highlights"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Legend Bar */}
      {showLegend && (
        <div className="absolute bottom-6 left-6 z-10 bg-black/90 backdrop-blur border border-zinc-800 rounded-lg p-3 shadow-xl max-w-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[11px] text-zinc-300">
            <span className="font-semibold">Topology Legend</span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-zinc-500 hover:text-zinc-300 text-[10px]"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-[10px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-400" />
              <span>Person (Circle)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rotate-45 bg-cyan-600 border border-cyan-400" />
              <span>Phone (Diamond)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-sm bg-amber-600 border border-amber-400" />
              <span>Vehicle (Rect)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-600 border border-emerald-400" />
              <span>Location (Hex)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-600 border border-purple-400" />
              <span>Account (Tag)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500" />
              <span>Critical Risk Glow</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
