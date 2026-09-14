"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Network,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldAlert,
  Clock,
  ExternalLink,
  Bot,
  RefreshCw,
  FolderGit2,
  Building2,
  User,
  UploadCloud,
  FileQuestion,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchCaseById, fetchCaseSummary } from "@/lib/api/cases";
import { fetchCaseGraph, fetchCommunities } from "@/lib/api/graph";
import { fetchEntities } from "@/lib/api/entities";
import { fetchAlerts } from "@/lib/api/alerts";
import { fetchTimeline } from "@/lib/api/timeline";
import { KpiCard } from "@/components/common/KpiCard";
import { RiskBadge } from "@/components/common/RiskBadge";
import { EntityBadge } from "@/components/common/EntityBadge";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { Case, Entity, Alert, TimelineEvent, GraphData } from "@/types";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

const COLORS = ["#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b"];

export default function CaseDashboard() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params?.caseId as string) || "";

  const [caseRecord, setCaseRecord] = useState<Case | null>(null);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [topEntities, setTopEntities] = useState<Entity[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  const loadCaseData = () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    fetchCaseById(caseId)
      .then((c) => {
        setCaseRecord(c);
        return Promise.all([
          fetchCaseSummary(caseId).catch(() => null),
          fetchCaseGraph(caseId, 150).catch(() => null),
          fetchEntities({ case_id: caseId, limit: 5 }).catch(() => []),
          fetchAlerts({ case_id: caseId }).catch(() => []),
          fetchTimeline({ case_id: caseId, limit: 5 }).catch(() => []),
          fetchCommunities(caseId).catch(() => null),
        ]);
      })
      .then(([summary, graph, entities, alerts, timeline, communities]) => {
        setCaseInfo(summary);
        setGraphData(graph);
        setTopEntities(entities);
        setRecentAlerts(alerts.slice(0, 5));
        setTimelineEvents(timeline);
        setCommunityData(communities);
      })
      .catch((err) => {
        if (err.message && (err.message.includes("404") || err.message.toLowerCase().includes("not found"))) {
          setNotFound(true);
        } else {
          setError(err.message || "Failed to load case overview.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  if (loading) {
    return <LoadingSkeleton text="Loading case data..." />;
  }

  // Handle Invalid / Non-existent Case
  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 select-none">
        <div className="w-full max-w-md bg-black border border-zinc-800 rounded-lg p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Case Not Found
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The requested investigation case file (<span className="text-white font-bold">{caseId}</span>) does not exist or has been removed.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/cases")}
              className="px-4 py-2 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
            >
              Return to Cases Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCaseData} />;
  }

  const hasIntelligence = (graphData?.nodes?.length ?? 0) > 0 || topEntities.length > 0;
  const firNumber = caseRecord?.fir_number || caseRecord?.case_number || "FIR-UNKNOWN";
  const caseName = caseRecord?.name || caseInfo?.case_name || "Investigation";
  const policeStation = caseRecord?.police_station || "Cyber Crime Cell";
  const officerName = caseRecord?.investigating_officer || "Investigating Officer";
  const officerRank = caseRecord?.officer_rank || "Inspector";
  const isClosed = caseRecord?.status === "CLOSED";

  // Calculate entity type chart data
  const entityTypeCounts: Record<string, number> = {};
  graphData?.nodes?.forEach((n) => {
    entityTypeCounts[n.type] = (entityTypeCounts[n.type] || 0) + 1;
  });
  const entityDistribution = Object.entries(entityTypeCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Calculate relationship distribution chart data
  const relTypeCounts: Record<string, number> = {};
  graphData?.edges?.forEach((e) => {
    relTypeCounts[e.relationship] = (relTypeCounts[e.relationship] || 0) + 1;
  });
  const relDistribution = Object.entries(relTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name: name.replace("_", " "),
      count,
    }));

  const highRiskCount =
    graphData?.nodes?.filter((n) => n.risk_level === "CRITICAL" || n.risk_level === "HIGH").length || 0;

  return (
    <div className="space-y-6 select-none">
      {/* Case Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-white">{caseName}</h1>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold">
              {firNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                isClosed
                  ? "bg-zinc-900 border border-zinc-700 text-zinc-400"
                  : "bg-white text-black border border-white font-bold"
              }`}
            >
              {caseRecord?.status || "ACTIVE"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{policeStation}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {officerName} ({officerRank})
              </span>
            </span>
          </div>

          <MarkdownRenderer
            content={
              caseRecord?.description ||
              caseInfo?.executive_summary ||
              "Case details and link analysis overview."
            }
            className="mt-2 max-w-3xl text-zinc-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => router.push(`/cases/${caseId}/explorer`)}
            className="px-3.5 py-2 rounded bg-white hover:bg-zinc-200 text-xs font-semibold text-black flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Network className="w-4 h-4" />
            <span>Network Explorer</span>
          </button>
          <button
            onClick={() => router.push(`/cases/${caseId}/assistant`)}
            className="px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-4 h-4 text-zinc-300" />
            <span>Assistant</span>
          </button>
          <button
            onClick={() => router.push(`/cases/${caseId}/sources`)}
            className="px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-zinc-400" />
            <span>Data Sources</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Total Entities"
          value={graphData?.metadata?.node_count || 0}
          icon={Users}
          subtitle="Indexed subjects"
          onClick={() => router.push(`/cases/${caseId}/entities`)}
        />
        <KpiCard
          title="Relationships"
          value={graphData?.metadata?.edge_count || 0}
          icon={Network}
          subtitle="Connected links"
          onClick={() => router.push(`/cases/${caseId}/explorer`)}
        />
        <KpiCard
          title="Flagged Alerts"
          value={recentAlerts.length}
          icon={AlertTriangle}
          subtitle="System anomalies"
          onClick={() => router.push(`/cases/${caseId}/alerts`)}
        />
        <KpiCard
          title="High Risk Nodes"
          value={highRiskCount}
          icon={ShieldAlert}
          subtitle="Score >= 60/100"
          onClick={() => router.push(`/cases/${caseId}/entities?min_risk=60`)}
        />
        <KpiCard
          title="Communities"
          value={communityData?.count || 0}
          icon={Layers}
          subtitle="Identified clusters"
          onClick={() => router.push(`/cases/${caseId}/explorer`)}
        />
        <KpiCard
          title="Network Density"
          value={(graphData?.metadata?.density || 0).toFixed(3)}
          icon={Activity}
          subtitle="Graph ratio"
        />
      </div>

      {/* EMPTY STATE FOR NEW / EMPTY CASES */}
      {!hasIntelligence ? (
        <div className="w-full rounded-lg border border-zinc-800 bg-black p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">No investigation data available yet</h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Upload a source or add data to build the case file.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push(`/cases/${caseId}/sources`)}
              className="px-4 py-2 rounded bg-white hover:bg-zinc-200 text-xs font-semibold text-black flex items-center gap-2 transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Data Source</span>
            </button>
            <button
              onClick={() => router.push("/cases")}
              className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
            >
              Back to Cases Directory
            </button>
          </div>
        </div>
      ) : (
        /* POPULATED DASHBOARD FOR CASES */
        <>
          {/* Main Grid: Priority Entities & Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Priority Entities */}
            <div className="bg-black rounded-lg border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    High Priority Entities
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/cases/${caseId}/entities`)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {topEntities.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => router.push(`/cases/${caseId}/explorer?highlight=${entity.id}`)}
                    className="p-3 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{entity.display_name}</span>
                        <EntityBadge type={entity.type} />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Betweenness: {entity.betweenness_centrality?.toFixed(3) || "0.000"} | PageRank:{" "}
                        {entity.pagerank_score?.toFixed(3) || "0.000"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <RiskBadge level={entity.risk_level} score={entity.risk_score} />
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Anomalies & Alerts */}
            <div className="bg-black rounded-lg border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Anomalies & Alerts
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/cases/${caseId}/alerts`)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => router.push(`/cases/${caseId}/alerts`)}
                    className="p-3 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 cursor-pointer space-y-1.5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span className="text-xs font-semibold text-zinc-200">{alert.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {alert.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entity Type Distribution */}
            <div className="bg-black rounded-lg border border-zinc-800 p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Entity Type Breakdown
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#a1a1aa", fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "#ffffff",
                      }}
                    />
                    <Bar dataKey="count" fill="#e4e4e7" radius={[4, 4, 0, 0]}>
                      {entityDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Relationship Types */}
            <div className="bg-black rounded-lg border border-zinc-800 p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Primary Link Types
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={relDistribution}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "#ffffff",
                      }}
                    />
                    <Bar dataKey="count" fill="#d4d4d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
