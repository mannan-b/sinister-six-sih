"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchCases } from "@/lib/api/cases";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

function AssistantContent({ currentCaseId }: { currentCaseId?: string }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") || "";

  const routeCaseId = params?.caseId as string | undefined;
  const [caseId, setCaseId] = useState<string>(currentCaseId || routeCaseId || "");

  useEffect(() => {
    if (!caseId && !routeCaseId && !currentCaseId) {
      fetchCases().then((cases) => {
        if (cases.length > 0) setCaseId(cases[0].id);
      });
    }
  }, [caseId, routeCaseId, currentCaseId]);

  const activeCaseId = currentCaseId || routeCaseId || caseId;

  return (
    <div className="h-[calc(100vh-7rem)] w-full">
      <AssistantChat caseId={activeCaseId} initialQuery={queryParam} />
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<LoadingSkeleton text="Initializing AI Investigation Copilot..." className="h-[80vh]" />}>
      <AssistantContent />
    </Suspense>
  );
}
