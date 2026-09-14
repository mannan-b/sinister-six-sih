"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Search, Filter, ArrowRight, Eye, UploadCloud } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchEntities } from "@/lib/api/entities";
import { EntityBadge } from "@/components/common/EntityBadge";
import { RiskBadge } from "@/components/common/RiskBadge";
import { EntityPanel } from "@/components/entities/EntityPanel";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Entity } from "@/types";

export default function EntitiesPage() {
  const router = useRouter();
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [minRisk, setMinRisk] = useState<number>(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId && !routeCaseId) {
      fetchCases().then((cases) => {
        if (cases.length > 0) setCaseId(cases[0].id);
      });
    }
  }, [caseId, routeCaseId]);

  const activeCaseId = routeCaseId || caseId;

  useEffect(() => {
    if (!activeCaseId) return;
    setLoading(true);
    fetchEntities({
      case_id: activeCaseId,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
      min_risk: minRisk > 0 ? minRisk : undefined,
      search: search.trim() || undefined,
      limit: 150,
    })
      .then((data) => setEntities(data))
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, [activeCaseId, typeFilter, minRisk, search]);

  return (
    <div className="space-y-4 select-none">
      <div className="space-y-4">
        {/* Header & Filter Controls */}
        <div className="p-4 rounded-lg bg-black border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-300" />
              <span>Entity Directory</span>
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Extracted persons, identifiers, locations, and financial instruments ({entities.length} records)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter entities..."
                className="w-full pl-8 pr-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Entity Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-200"
            >
              <option value="ALL">All Types</option>
              <option value="PERSON">Persons</option>
              <option value="PHONE">Phones</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="BANK_ACCOUNT">Bank Accounts</option>
              <option value="LOCATION">Locations</option>
            </select>

            {/* Risk Threshold */}
            <select
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-200"
            >
              <option value="0">All Risk Levels</option>
              <option value="40">Moderate (&gt;= 40)</option>
              <option value="60">High & Critical (&gt;= 60)</option>
              <option value="80">Critical Only (&gt;= 80)</option>
            </select>
          </div>
        </div>

        {/* Entities Table */}
        <div className="rounded-lg bg-black border border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="p-8">
              <LoadingSkeleton text="Loading entities..." />
            </div>
          ) : entities.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Entities Found"
                description={
                  search
                    ? "No entities match the active search query or risk filter."
                    : "Upload an investigation source to begin extracting entities for this case."
                }
                actionLabel={search ? undefined : "Upload Case Sources"}
                onAction={
                  search
                    ? undefined
                    : () => router.push(activeCaseId ? `/cases/${activeCaseId}/sources` : "/sources")
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Subject / Identifier</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Risk Indicator</th>
                    <th className="px-4 py-3">Betweenness</th>
                    <th className="px-4 py-3">PageRank</th>
                    <th className="px-4 py-3">Community</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {entities.map((entity) => (
                    <tr
                      key={entity.id}
                      onClick={() => setSelectedEntityId(entity.id)}
                      className={`hover:bg-zinc-900 cursor-pointer transition-colors ${
                        selectedEntityId === entity.id ? "bg-zinc-900" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{entity.display_name}</div>
                        {entity.aliases && entity.aliases.length > 0 && (
                          <div className="text-[10px] text-zinc-400 truncate max-w-xs">
                            Aliases: {entity.aliases.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <EntityBadge type={entity.type} />
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={entity.risk_level} score={entity.risk_score} />
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-[11px]">
                        {entity.betweenness_centrality?.toFixed(4) || "0.0000"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-[11px]">
                        {entity.pagerank_score?.toFixed(4) || "0.0000"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          Cluster {entity.community_id || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntityId(entity.id);
                          }}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="View Entity Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Profile Drawer */}
      {selectedEntityId && (
        <EntityPanel
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
        />
      )}
    </div>
  );
}
