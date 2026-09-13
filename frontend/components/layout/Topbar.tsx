"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Shield, CheckCircle2, ChevronDown, FolderGit2, Plus, ExternalLink } from "lucide-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Case } from "@/types";
import { fetchCases } from "@/lib/api/cases";
import { fetchEntities } from "@/lib/api/entities";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // Debounced Global Search scoped to active case
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !activeCaseId) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const ents = await fetchEntities({
          case_id: activeCaseId,
          search: searchQuery,
          limit: 6,
        });
        setSearchResults(ents);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, activeCaseId]);

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
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-20 font-mono select-none">
      {/* Case Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
            CASE
          </div>
          <button
            onClick={() => {
              refreshCases();
              setShowDropdown(!showDropdown);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-raised border border-border hover:border-nexus-600 text-xs text-white transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-nexus-400" />
            <span className="font-semibold">{activeCase?.name || "Select Investigation"}</span>
            {activeCase && (
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                {activeCase.fir_number || activeCase.case_number}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showDropdown && (
            <div className="absolute left-0 mt-1 w-72 rounded-md bg-surface-raised border border-border shadow-2xl z-50 p-1 divide-y divide-border/60">
              <div className="px-3 py-1.5 text-[10px] uppercase text-slate-400 flex items-center justify-between">
                <span>Active Investigations ({cases.length})</span>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/cases");
                  }}
                  className="text-nexus-400 hover:text-nexus-300 flex items-center gap-1"
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
                          ? "bg-nexus-900/50 text-nexus-300 border border-nexus-700/50"
                          : "text-slate-300 hover:bg-surface-hover"
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{fir}</p>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          c.status === "CLOSED"
                            ? "bg-slate-900 text-slate-400 border border-slate-700"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800"
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
                  className="w-full text-left px-3 py-2 rounded text-xs text-nexus-400 hover:bg-surface-hover flex items-center gap-2 transition-colors font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register / Manage Cases</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 pt-3">
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>ONLINE</span>
          </span>
        </div>
      </div>

      {/* Global Search Bar (Scoped to Active Case) */}
      <div className="relative w-80 lg:w-96">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!activeCaseId}
            placeholder={
              activeCaseId
                ? `Search ${activeCase?.name || "case"} entities...`
                : "Select an investigation to search..."
            }
            className="w-full pl-9 pr-4 py-1.5 rounded-md bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs text-slate-200 placeholder:text-slate-400 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Autocomplete Results */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 rounded-md bg-surface-raised border border-border shadow-2xl z-50 p-1">
            <div className="px-3 py-1 text-[10px] uppercase text-slate-400">
              Matching Case Entities ({searchResults.length})
            </div>
            {searchResults.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSearchQuery("");
                  router.push(
                    activeCaseId
                      ? `/cases/${activeCaseId}/explorer?highlight=${item.id}`
                      : `/explorer?highlight=${item.id}`
                  );
                }}
                className="px-3 py-2 rounded hover:bg-surface-hover cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">{item.display_name}</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    {item.type}
                  </span>
                </div>
                <span className="text-[10px] text-orange-400">Risk: {item.risk_score}/100</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(activeCaseId ? `/cases/${activeCaseId}/alerts` : "/alerts")}
          className="p-2 rounded-md bg-surface-raised border border-border hover:border-nexus-500 text-slate-300 hover:text-white transition-colors relative"
          title="View Case Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 animate-pulse" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border/70">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            AG
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-slate-200">Investigator 01</p>
            <p className="text-[10px] text-slate-400">Special Intel Cell</p>
          </div>
        </div>
      </div>
    </header>
  );
}
