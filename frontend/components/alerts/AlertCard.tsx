"use client";

import React from "react";
import { AlertTriangle, CheckCircle, EyeOff, ShieldAlert, ArrowRight, FileText } from "lucide-react";
import { Alert } from "@/types";
import { useRouter } from "next/navigation";
import { updateAlertStatus } from "@/lib/api/alerts";

interface AlertCardProps {
  alert: Alert;
  onStatusChange?: (updatedAlert: Alert) => void;
}

export function AlertCard({ alert, onStatusChange }: AlertCardProps) {
  const router = useRouter();

  const handleStatus = async (status: string) => {
    try {
      const updated = await updateAlertStatus(alert.id, status);
      if (onStatusChange) onStatusChange(updated);
    } catch {}
  };

  let severityStyle = "bg-orange-950/80 border-orange-700 text-orange-300";
  if (alert.severity === "CRITICAL") {
    severityStyle = "bg-red-950/90 border-red-600 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]";
  } else if (alert.severity === "MEDIUM") {
    severityStyle = "bg-amber-950/80 border-amber-700 text-amber-300";
  } else if (alert.severity === "LOW") {
    severityStyle = "bg-emerald-950/80 border-emerald-700 text-emerald-300";
  }

  return (
    <div className="p-4 rounded-lg bg-surface border border-border hover:border-nexus-600/70 transition-all space-y-3 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityStyle}`}>
              {alert.severity}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
              alert.category === "SUSPICIOUS_DRIVER_ESCORT"
                ? "bg-purple-950/80 border-purple-700 text-purple-300"
                : alert.category === "COMMERCIAL_CAB_TRANSIT"
                ? "bg-sky-950/80 border-sky-700 text-sky-300"
                : alert.category === "SELF_DRIVEN_TRANSIT"
                ? "bg-amber-950/80 border-amber-700 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}>
              {alert.category.replace(/_/g, " ")}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                alert.status === "NEW"
                  ? "bg-blue-950 text-blue-400 border border-blue-800"
                  : alert.status === "REVIEWED"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-slate-900 text-slate-500"
              }`}
            >
              {alert.status}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white pt-1">{alert.title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {alert.entity_id && (
            <button
              onClick={() => router.push(`/explorer?highlight=${alert.entity_id}`)}
              className="px-2.5 py-1 rounded bg-surface-raised border border-border hover:border-nexus-500 text-[10px] text-nexus-300 flex items-center gap-1 transition-colors"
            >
              <span>View in Graph</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => {
              sessionStorage.setItem("assistantContext", JSON.stringify({ type: "alert", data: alert }));
              router.push(`/cases/${alert.case_id}/assistant`);
            }}
            className="px-2.5 py-1 rounded bg-nexus-600 hover:bg-nexus-500 text-[10px] text-white flex items-center gap-1 transition-colors shadow-sm"
          >
            <span>Ask AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-slate-300 text-xs leading-relaxed">{alert.explanation}</p>

      {/* Verifiable Evidence */}
      {alert.evidence && alert.evidence.length > 0 && (
        <div className="p-2.5 rounded bg-surface-raised border border-border/70 text-[11px] space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <FileText className="w-3 h-3 text-nexus-400" />
            <span>SUPPORTING EVIDENCE ({alert.evidence.length})</span>
          </div>
          <ul className="space-y-1 pl-3 text-slate-300 list-disc">
            {alert.evidence.map((ev, i) => (
              <li key={i}>{typeof ev === "string" ? ev : JSON.stringify(ev)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-slate-400">
        <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>

        <div className="flex items-center gap-2">
          {alert.status !== "REVIEWED" && (
            <button
              onClick={() => handleStatus("REVIEWED")}
              className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Mark Reviewed</span>
            </button>
          )}

          {alert.status !== "DISMISSED" && (
            <button
              onClick={() => handleStatus("DISMISSED")}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 flex items-center gap-1 transition-colors"
            >
              <EyeOff className="w-3 h-3" />
              <span>Dismiss</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
