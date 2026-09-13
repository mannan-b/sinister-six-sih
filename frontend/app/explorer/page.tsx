"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchCases } from "@/lib/api/cases";
import { fetchCaseGraph } from "@/lib/api/graph";
import { GraphViewer } from "@/components/graph/GraphViewer";
import { EntityPanel } from "@/components/entities/EntityPanel";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { GraphData, GraphNode, GraphEdge } from "@/types";

function ExplorerContent({ currentCaseId }: { currentCaseId?: string }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");

  const routeCaseId = params?.caseId as string | undefined;
  const [caseId, setCaseId] = useState<string>(currentCaseId || routeCaseId || "");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId && !routeCaseId) {
      fetchCases()
        .then((cases) => {
          if (cases.length > 0) setCaseId(cases[0].id);
        })
        .catch(() => setError("Failed to retrieve cases."));
    }
  }, [caseId, routeCaseId]);

  useEffect(() => {
    const activeId = currentCaseId || routeCaseId || caseId;
    if (!activeId) return;

    setLoading(true);
    setError(null);
    fetchCaseGraph(activeId, 300)
      .then((data) => {
        setGraphData(data);
        if (highlightParam && data.nodes) {
          const match = data.nodes.find((n) => n.id === highlightParam);
          if (match) setSelectedNode(match);
        }
      })
      .catch((err) => setError(err.message || "Failed to load network topology."))
      .finally(() => setLoading(false));
  }, [caseId, routeCaseId, currentCaseId, highlightParam]);

  const activeId = currentCaseId || routeCaseId || caseId;

  if (loading) {
    return <LoadingSkeleton text="Rendering interactive Cytoscape knowledge graph..." className="h-[80vh]" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => setCaseId(activeId)} />;
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center font-mono">
        <div className="w-full max-w-lg">
          <EmptyState
            title="No Knowledge Graph Data"
            description="No entities or link relationships have been ingested for this case yet. Upload an investigation document or CDR log to generate the network topology."
            actionLabel="Upload Case Sources"
            onAction={() => router.push(activeId ? `/cases/${activeId}/sources` : "/sources")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-7rem)] w-full rounded-lg border border-border overflow-hidden flex font-mono">
      {/* Cytoscape Graph Canvas */}
      <div className="flex-1 h-full relative">
        <GraphViewer
          data={graphData}
          caseId={activeId}
          onSelectNode={(node) => setSelectedNode(node)}
          onSelectEdge={(edge) => setSelectedEdge(edge)}
          highlightedNodeId={highlightParam || selectedNode?.id}
        />
      </div>

      {/* Slide-over Entity Intelligence Drawer */}
      {selectedNode && (
        <EntityPanel
          entityId={selectedNode.id}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<LoadingSkeleton text="Loading Network Explorer..." className="h-[80vh]" />}>
      <ExplorerContent />
    </Suspense>
  );
}
