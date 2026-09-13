"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchTimeline } from "@/lib/api/timeline";
import { TimelineView } from "@/components/timeline/TimelineView";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { TimelineEvent } from "@/types";

export default function TimelinePage() {
  const router = useRouter();
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
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
    fetchTimeline({ case_id: activeCaseId, limit: 100 })
      .then((data) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [activeCaseId]);

  return (
    <div className="space-y-4 font-mono select-none">
      <div className="p-4 rounded-lg bg-surface border border-border">
        <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-nexus-400" />
          <span>Investigation Chronology & Event Timeline</span>
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Chronologically correlated meetings, communication bursts, surveillance traces, and financial transfers.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton text="Loading investigation timeline..." />
      ) : events.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No Timeline Events Recorded"
            description="No timeline events recorded for this case. Upload surveillance logs or incident records to build the chronology."
            actionLabel="Upload Case Sources"
            onAction={() => router.push(activeCaseId ? `/cases/${activeCaseId}/sources` : "/sources")}
          />
        </div>
      ) : (
        <TimelineView events={events} />
      )}
    </div>
  );
}
