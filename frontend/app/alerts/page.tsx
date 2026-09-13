"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Filter } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchAlerts } from "@/lib/api/alerts";
import { AlertCard } from "@/components/alerts/AlertCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/types";

export default function AlertsPage() {
  const router = useRouter();
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId && !routeCaseId) {
      fetchCases().then((cases) => {
        if (cases.length > 0) setCaseId(cases[0].id);
      });
    }
  }, [caseId, routeCaseId]);

  const activeCaseId = routeCaseId || caseId;

  const loadAlerts = () => {
    if (!activeCaseId) return;
    setLoading(true);
    fetchAlerts({
      case_id: activeCaseId,
      severity: severityFilter !== "ALL" ? severityFilter : undefined,
      category: categoryFilter !== "ALL" ? categoryFilter : undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    })
      .then((data) => setAlerts(data))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, [activeCaseId, severityFilter, categoryFilter, statusFilter]);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Header & Filter Controls */}
      <div className="p-4 rounded-lg bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Risk Indicators & Anomaly Alert Engine</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Automated alerts backed by anomaly detection and graph topology ({alerts.length} alerts)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs text-slate-200"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs text-slate-200"
          >
            <option value="ALL">All Categories</option>
            <option value="FINANCIAL">Financial</option>
            <option value="COMMUNICATION">Communication</option>
            <option value="LOCATION">Location</option>
            <option value="NETWORK">Network Topology</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <LoadingSkeleton text="Synthesizing anomaly alerts..." />
      ) : alerts.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No Alerts Flagged"
            description="No anomalies or intelligence alerts flagged for this investigation."
            actionLabel="Upload Case Sources"
            onAction={() => router.push(activeCaseId ? `/cases/${activeCaseId}/sources` : "/sources")}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onStatusChange={() => loadAlerts()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
