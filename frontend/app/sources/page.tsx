"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Database, Upload, FileText, CheckCircle2 } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchAnalysisRuns } from "@/lib/api/analysis";
import { FileUploader } from "@/components/ingestion/FileUploader";
import { AnalysisRun } from "@/types";

export default function SourcesPage() {
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [runs, setRuns] = useState<AnalysisRun[]>([]);

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

  return (
    <div className="space-y-6 font-mono select-none">
      <div className="p-4 rounded-lg bg-surface border border-border">
        <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-nexus-400" />
          <span>Multi-Modal Data Ingestion & Source Traceability</span>
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Ingest unstructured police FIR reports, CDR call records, and banking CSV files into the unified graph model.
        </p>
      </div>

      {/* Ingestion Console */}
      <FileUploader caseId={activeCaseId} onUploadSuccess={() => loadRuns()} />

      {/* Recent Ingestion History */}
      <div className="p-5 rounded-lg bg-surface border border-border space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          Ingestion & Pipeline Run History ({runs.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Input Files</th>
                <th className="px-4 py-3">Entities</th>
                <th className="px-4 py-3">Relationships</th>
                <th className="px-4 py-3">Alerts</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{r.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-bold text-white">{r.run_type}</td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {r.input_files && r.input_files.length > 0 ? r.input_files.join(", ") : "Single Document Upload"}
                  </td>
                  <td className="px-4 py-3 text-nexus-400 font-bold">+{r.entities_extracted}</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">+{r.relationships_extracted}</td>
                  <td className="px-4 py-3 text-red-400 font-bold">+{r.alerts_generated}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
