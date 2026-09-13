"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, RefreshCw, CheckCircle2, Play } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchAnalysisRuns, triggerPipelineAnalysis } from "@/lib/api/analysis";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { AnalysisRun } from "@/types";

export default function AnalysisPage() {
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId && !routeCaseId) {
      fetchCases().then((cases) => {
        if (cases.length > 0) setCaseId(cases[0].id);
      });
    }
  }, [caseId, routeCaseId]);

  const activeCaseId = routeCaseId || caseId;

  const loadRuns = () => {
    if (!activeCaseId) return;
    fetchAnalysisRuns(activeCaseId)
      .then((data) => setRuns(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadRuns();
  }, [activeCaseId]);

  const handleRunAnalysis = async () => {
    if (!activeCaseId || isAnalyzing) return;
    setIsAnalyzing(true);
    setSuccessMsg(null);
    try {
      const res = await triggerPipelineAnalysis(activeCaseId);
      setSuccessMsg(res.message || "Pipeline analysis executed successfully.");
      loadRuns();
    } catch {
      setSuccessMsg("Analysis run failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-mono select-none">
      <div className="p-4 rounded-lg bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-nexus-400" />
            <span>Analysis Pipeline Runs & Graph Recalculation</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Audit trail of network analytics, centrality recalculations, community detections, and anomaly runs.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2 rounded bg-nexus-600 hover:bg-nexus-500 text-xs font-semibold text-white flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Network Topology...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Trigger Full Analytics Pipeline</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Analysis Runs List */}
      <div className="p-5 rounded-lg bg-surface border border-border space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          Completed Analysis Runs ({runs.length})
        </h2>

        {runs.length === 0 ? (
          <p className="text-xs text-slate-400">No pipeline analysis runs recorded for this case.</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className="p-4 rounded bg-surface-raised border border-border/70 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{run.run_type}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                    {run.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>Entities Extracted: <span className="text-white font-bold">{run.entities_extracted}</span></div>
                  <div>Relationships: <span className="text-white font-bold">{run.relationships_extracted}</span></div>
                  <div>Alerts Generated: <span className="text-white font-bold">{run.alerts_generated}</span></div>
                  <div>Duration: <span className="text-white font-bold">{run.duration_seconds}s</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
