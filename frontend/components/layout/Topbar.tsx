"use client";

import React, { useState, useEffect } from "react";
import { Bell, Shield, CheckCircle2, ChevronDown, FolderGit2, Plus, ExternalLink } from "lucide-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Case } from "@/types";
import { fetchCases } from "@/lib/api/cases";

interface TopbarProps {
  currentCaseId: string;
  onCaseChange: (caseId: string) => void;
}

export function Topbar({ currentCaseId, onCaseChange }: TopbarProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Determine active case ID from URL params or props
  let routeCaseId = params?.caseId as string | undefined;
  if (!routeCaseId && pathname.startsWith("/cases/")) {
    const segments = pathname.split("/");
    if (segments.length >= 3 && segments[2]) {
      routeCaseId = segments[2];
    }
  }
  const activeCaseId = routeCaseId || currentCaseId;

  const [cases, setCases] = useState<Case[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load cases from backend
  const refreshCases = () => {
    fetchCases()
      .then((data) => {
        setCases(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshCases();
  }, [pathname]);

  const activeCase = cases.find((c) => c.id === activeCaseId);

  const handleCaseSelect = (targetCase: Case) => {
    onCaseChange(targetCase.id);
    setShowDropdown(false);

    // If currently in a subroute, preserve subroute for target case
    if (activeCaseId && pathname.startsWith(`/cases/${activeCaseId}/`)) {
      const subRoute = pathname.replace(`/cases/${activeCaseId}/`, "");
      router.push(`/cases/${targetCase.id}/${subRoute}`);
    } else {
      router.push(`/cases/${targetCase.id}`);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-black px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Case Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold mb-0.5">
            CASE
          </div>
          <button
            onClick={() => {
              refreshCases();
              setShowDropdown(!showDropdown);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-xs text-white transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-zinc-300" />
            <span className="font-semibold">{activeCase?.name || "Select Investigation"}</span>
            {activeCase && (
              <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">
                {activeCase.fir_number || activeCase.case_number}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          </button>

          {showDropdown && (
            <div className="absolute left-0 mt-1 w-72 rounded-md bg-black border border-zinc-800 shadow-2xl z-50 p-1 divide-y divide-zinc-800">
              <div className="px-3 py-1.5 text-[10px] uppercase text-zinc-400 flex items-center justify-between">
                <span>Active Investigations ({cases.length})</span>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/cases");
                  }}
                  className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>All Cases</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
                {cases.map((c) => {
                  const isSelected = c.id === activeCaseId;
                  const fir = c.fir_number || c.case_number;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleCaseSelect(c)}
                      className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-zinc-900 text-white border border-zinc-700 font-semibold"
                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{fir}</p>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          c.status === "CLOSED"
                            ? "bg-zinc-900 text-zinc-400 border border-zinc-800"
                            : "bg-white text-black border border-white font-bold"
                        }`}
                      >
                        {c.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/cases");
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register / Manage Cases</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 pt-3">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-white" />
            <span>ONLINE</span>
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(activeCaseId ? `/cases/${activeCaseId}/alerts` : "/alerts")}
          className="p-2 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors relative"
          title="View Case Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-white absolute top-1.5 right-1.5 animate-pulse" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
            AG
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-white">Investigator 01</p>
            <p className="text-[10px] text-zinc-400">Special Intel Cell</p>
          </div>
        </div>
      </div>
    </header>
  );
}
