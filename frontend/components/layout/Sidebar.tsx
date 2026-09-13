"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Users,
  Clock,
  ArrowLeftRight,
  PhoneCall,
  AlertTriangle,
  Bot,
  Database,
  Activity,
  Settings,
  ShieldCheck,
  FolderGit2,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();

  // Extract caseId from route parameters or path
  let activeCaseId = params?.caseId as string | undefined;
  if (!activeCaseId && pathname.startsWith("/cases/")) {
    const segments = pathname.split("/");
    if (segments.length >= 3 && segments[2]) {
      activeCaseId = segments[2];
    }
  }

  const isCasesDirectory = pathname === "/cases";

  const getHref = (subPath: string) => {
    if (activeCaseId) {
      return subPath === "" ? `/cases/${activeCaseId}` : `/cases/${activeCaseId}/${subPath}`;
    }
    return "/cases";
  };

  const navItems = [
    { label: "Case Dashboard", subPath: "", icon: LayoutDashboard },
    { label: "Network Explorer", subPath: "explorer", icon: Network },
    { label: "Entities Directory", subPath: "entities", icon: Users },
    { label: "Investigation Timeline", subPath: "timeline", icon: Clock },
    { label: "Transactions", subPath: "transactions", icon: ArrowLeftRight },
    { label: "Communications", subPath: "communications", icon: PhoneCall },
    { label: "Alerts & Anomalies", subPath: "alerts", icon: AlertTriangle },
    { label: "AI Assistant", subPath: "assistant", icon: Bot },
    { label: "Data Sources", subPath: "sources", icon: Database },
    { label: "Analysis Runs", subPath: "analysis", icon: Activity },
    { label: "Settings & Ethics", subPath: "settings", icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0 z-30 select-none font-mono">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border/80 bg-surface">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-indigo-700 flex items-center justify-center shadow-glow">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold tracking-widest text-sm text-white">NEXUS</span>
            <span className="px-1.5 py-0.2 rounded bg-nexus-950 border border-nexus-800 text-[10px] font-mono text-nexus-400">
              INTEL
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">AI Investigation Platform</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Global Directory Link */}
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Global Directory
        </div>
        <Link
          href="/cases"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors mb-3 ${
            isCasesDirectory
              ? "bg-nexus-900/50 text-nexus-300 border border-nexus-600/50 shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-surface-raised"
          }`}
        >
          <FolderGit2 className={`w-4 h-4 shrink-0 ${isCasesDirectory ? "text-nexus-400" : "text-slate-400"}`} />
          <span className="truncate font-semibold">All Investigations</span>
        </Link>

        {/* Case-Scoped Modules */}
        <div className="px-3 pb-2 pt-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-t border-border/50 flex items-center justify-between">
          <span>Case Modules</span>
          {activeCaseId && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400">
              SCOPED
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const href = getHref(item.subPath);
          const isActive =
            activeCaseId &&
            (item.subPath === ""
              ? pathname === `/cases/${activeCaseId}`
              : pathname.startsWith(`/cases/${activeCaseId}/${item.subPath}`));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-nexus-900/40 text-nexus-300 border border-nexus-600/40 shadow-sm"
                  : activeCaseId
                  ? "text-slate-400 hover:text-slate-200 hover:bg-surface-raised"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-raised"
              }`}
              title={!activeCaseId ? "Select an active case first" : item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-nexus-400" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Security Statement Footer */}
      <div className="p-3.5 border-t border-border/70 bg-surface-raised/30">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Local Engine Active</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
          Investigative Lead Assistant v1.0
        </p>
      </div>
    </aside>
  );
}
