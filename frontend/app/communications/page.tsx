"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneCall, Search, AlertTriangle, ShieldCheck } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchCommunications } from "@/lib/api/communications";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Communication } from "@/types";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

export default function CommunicationsPage() {
  const router = useRouter();
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [comms, setComms] = useState<Communication[]>([]);
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
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
    fetchCommunications({
      case_id: activeCaseId,
      is_anomalous: anomalyOnly ? true : undefined,
      phone: searchPhone.trim() || undefined,
      limit: 100,
    })
      .then((data) => setComms(data))
      .catch(() => setComms([]))
      .finally(() => setLoading(false));
  }, [activeCaseId, anomalyOnly, searchPhone]);

  return (
    <div className="space-y-4 select-none">
      {/* Header & Controls */}
      <div className="p-4 rounded-lg bg-black border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-zinc-300" />
            <span>Call Detail Records (CDR) & Communication Bursts</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Communication frequency, duration analysis, and burst detection ({comms.length} records)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Search phone number..."
              className="w-full pl-8 pr-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-white placeholder:text-zinc-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={anomalyOnly}
              onChange={(e) => setAnomalyOnly(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-800 text-white focus:ring-0"
            />
            <span>Anomalies Only</span>
          </label>
        </div>
      </div>

      {/* Communications Table */}
      <div className="rounded-lg bg-black border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton text="Loading CDR communications..." />
          </div>
        ) : comms.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Communication Records Found"
              description={
                searchPhone || anomalyOnly
                  ? "No records matched the filter criteria."
                  : "No Call Detail Records (CDR) or communication logs found for this case."
              }
              actionLabel={searchPhone || anomalyOnly ? undefined : "Upload CDR CSV"}
              onAction={
                searchPhone || anomalyOnly
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
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Caller</th>
                  <th className="px-4 py-3">Receiver</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {comms.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-zinc-900 transition-colors ${
                      c.is_anomalous ? "bg-red-950/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-zinc-400 text-[11px]">
                      {new Date(c.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{c.caller_phone}</div>
                      {c.caller_name && c.caller_name !== c.caller_phone && (
                        <div className="text-[10px] text-zinc-400">{c.caller_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{c.receiver_phone}</div>
                      {c.receiver_name && c.receiver_name !== c.receiver_phone && (
                        <div className="text-[10px] text-zinc-400">{c.receiver_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                        {c.communication_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.is_anomalous ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-700 text-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          ANOMALY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-zinc-400 max-w-xs truncate">
                      <MarkdownRenderer content={c.anomaly_reason || "Within baseline call parameters"} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
