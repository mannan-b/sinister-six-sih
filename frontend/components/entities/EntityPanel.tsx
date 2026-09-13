"use client";

import React, { useEffect, useState } from "react";
import { X, ShieldAlert, Network, ArrowRight, Bot, Phone, Car, MapPin, CreditCard, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { Entity, EntityProfile } from "@/types";
import { fetchEntityProfile } from "@/lib/api/entities";
import { RiskBadge } from "@/components/common/RiskBadge";
import { EntityBadge } from "@/components/common/EntityBadge";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

interface EntityPanelProps {
  entityId: string | null;
  onClose: () => void;
}

export function EntityPanel({ entityId, onClose }: EntityPanelProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<EntityProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    fetchEntityProfile(entityId)
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [entityId]);

  if (!entityId) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Slide-over Profile Drawer */}
      <div className="fixed inset-y-0 right-0 w-96 max-w-[90vw] bg-surface/98 backdrop-blur-md border-l border-border h-full flex flex-col shadow-2xl z-50 overflow-hidden select-none font-mono">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/60">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-nexus-400 shrink-0" />
            <span className="text-xs font-mono font-bold tracking-wider text-white truncate">
              ENTITY INTELLIGENCE PROFILE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-hover text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {loading ? (
            <LoadingSkeleton text="Retrieving multi-modal intelligence profile..." />
          ) : profile ? (
            <>
              {/* Identity Card */}
              <div className="p-3.5 rounded-lg bg-surface-raised border border-border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-white tracking-tight break-all">
                      {profile.entity.display_name}
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 break-all">
                      Canonical ID: {profile.entity.canonical_name}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <EntityBadge type={profile.entity.type} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[11px] text-slate-400 shrink-0">Risk Indicator:</span>
                  <RiskBadge
                    level={profile.entity.risk_level}
                    score={profile.entity.risk_score}
                  />
                </div>

                {profile.entity.aliases && profile.entity.aliases.length > 0 && (
                  <div className="text-[10px] text-slate-400 break-words">
                    <span className="text-slate-400">Known Aliases: </span>
                    <span className="text-slate-300">{profile.entity.aliases.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Why is this Entity Flagged? */}
              <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="truncate">Key Measurable Indicators</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {profile.risk_reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 break-words">
                      <span className="text-red-400 shrink-0">•</span>
                      <span className="break-words leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Network Analytics Metrics */}
              <div className="p-3.5 rounded-lg bg-surface-raised border border-border space-y-2">
                <div className="flex items-center gap-1.5 text-nexus-400 font-semibold">
                  <Network className="w-4 h-4 shrink-0" />
                  <span className="truncate">Graph Centrality & Topology</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-surface border border-border/60">
                    <p className="text-[10px] text-slate-400 truncate">Betweenness (Bridge)</p>
                    <p className="font-bold text-white text-xs mt-0.5">
                      {profile.metrics.betweenness.toFixed(3)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-surface border border-border/60">
                    <p className="text-[10px] text-slate-400 truncate">PageRank (Influence)</p>
                    <p className="font-bold text-white text-xs mt-0.5">
                      {profile.metrics.pagerank.toFixed(3)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-surface border border-border/60">
                    <p className="text-[10px] text-slate-400 truncate">Degree Centrality</p>
                    <p className="font-bold text-white text-xs mt-0.5">
                      {profile.metrics.degree.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-surface border border-border/60">
                    <p className="text-[10px] text-slate-400 truncate">Cluster / Community</p>
                    <p className="font-bold text-nexus-300 text-xs mt-0.5 truncate">
                      Community {profile.metrics.community_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Connections */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-semibold truncate">
                  <span>Associated Connections ({profile.associated_entities.length})</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {profile.associated_entities.map((assoc, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-surface-raised border border-border/60 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white truncate block">
                          {assoc.connected_entity_name}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate">
                          {assoc.relationship_type} ({assoc.direction.toLowerCase()})
                        </p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 shrink-0">
                        {(assoc.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem("assistantContext", JSON.stringify({ type: "entity", data: profile.entity }));
                    router.push(`/cases/${profile.entity.case_id}/assistant`);
                  }}
                  className="w-full py-2 px-3 rounded bg-nexus-600 hover:bg-nexus-500 text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-xs truncate"
                >
                  <Bot className="w-4 h-4 shrink-0" />
                  <span className="truncate">Ask AI Assistant About Subject</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-400 py-10">Entity not found.</p>
          )}
        </div>
      </div>
    </>
  );
}
