"use client";

import React, { useState } from "react";
import { Clock, MapPin, AlertCircle, ArrowRight, Filter, Calendar } from "lucide-react";
import { TimelineEvent } from "@/types";
import { RiskBadge } from "@/components/common/RiskBadge";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

interface TimelineViewProps {
  events: TimelineEvent[];
  onSelectEntity?: (entityId: string) => void;
}

export function TimelineView({ events, onSelectEntity }: TimelineViewProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  const filteredEvents = events.filter((ev) => {
    if (selectedType !== "ALL" && ev.event_type !== selectedType) return false;
    if (selectedSeverity !== "ALL" && ev.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-4 select-none">
      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-black border border-zinc-800 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-300 font-semibold">Filter Events:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="MEETING">Meetings</option>
            <option value="COMMUNICATION">Communications</option>
            <option value="TRANSACTION">Transactions</option>
            <option value="SURVEILLANCE">Surveillance</option>
            <option value="MOVEMENT">Movements</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-zinc-800 ml-4 space-y-6 py-2">
        {filteredEvents.map((ev, idx) => {
          let dotColor = "bg-blue-500 border-blue-300";
          let badgeStyle = "bg-zinc-900 text-zinc-300 border-zinc-700";

          if (ev.severity === "CRITICAL") {
            dotColor = "bg-red-500 border-red-300 animate-pulse";
            badgeStyle = "bg-red-950 text-red-400 border-red-800";
          } else if (ev.severity === "WARNING") {
            dotColor = "bg-amber-500 border-amber-300";
            badgeStyle = "bg-amber-950 text-amber-400 border-amber-800";
          }

          const dateStr = new Date(ev.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={ev.id || idx} className="relative pl-6">
              {/* Timeline Node Point */}
              <div
                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${dotColor}`}
              />

              {/* Event Card */}
              <div className="p-4 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{ev.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${badgeStyle}`}>
                      {ev.event_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <MarkdownRenderer content={ev.description} />

                {ev.location_name && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Location: {ev.location_name}</span>
                  </div>
                )}

                {/* Involved Entities */}
                {ev.involved_entities && ev.involved_entities.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-zinc-400">Involved Subjects:</span>
                    {ev.involved_entities.map((ent) => (
                      <button
                        key={ent.id}
                        onClick={() => {
                          if (onSelectEntity) onSelectEntity(ent.id);
                          else router.push(`/explorer?highlight=${ent.id}`);
                        }}
                        className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 hover:text-white transition-colors"
                      >
                        <span>{ent.name}</span>
                        <span className="text-orange-400 ml-1">({ent.risk_score})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
