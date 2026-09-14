"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {  LayoutDashboard,  Network,  Users,  Clock,  ArrowLeftRight,PhoneCall,  AlertTriangle,  Bot,  Database,  Activity,  Settings, ShieldCheck,  FolderGit2, X,  ArrowRight,} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const [showCaseNotice, setShowCaseNotice] = useState(false);

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
      return subPath === ""
        ? `/cases/${activeCaseId}`
        : `/cases/${activeCaseId}/${subPath}`;
    }

    return "/cases";
  };

  const showNoCaseNotice = () => {
    setShowCaseNotice(true);

    setTimeout(() => {
      setShowCaseNotice(false);
    }, 3500);
  };

  const navItems = [
    {
      label: "Case Dashboard",
      subPath: "",
      icon: LayoutDashboard,
    },
    {
      label: "Network Explorer",
      subPath: "explorer",
      icon: Network,
    },
    {
      label: "Entities Directory",
      subPath: "entities",
      icon: Users,
    },
    {
      label: "Investigation Timeline",
      subPath: "timeline",
      icon: Clock,
    },
    {
      label: "Transactions",
      subPath: "transactions",
      icon: ArrowLeftRight,
    },
    {
      label: "Communications",
      subPath: "communications",
      icon: PhoneCall,
    },
    {
      label: "Alerts & Anomalies",
      subPath: "alerts",
      icon: AlertTriangle,
    },
    {
      label: "AI Assistant",
      subPath: "assistant",
      icon: Bot,
    },
    {
      label: "Data Sources",
      subPath: "sources",
      icon: Database,
    },
    {
      label: "Analysis Runs",
      subPath: "analysis",
      icon: Activity,
    },
    {
      label: "Settings & Ethics",
      subPath: "settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {showCaseNotice && (
        <div className="fixed top-5 right-5 z-[100] w-[340px] bg-[#050505] border border-[#34383f] rounded-lg shadow-2xl">
          <div className="flex items-start gap-3 p-4">
            <div className="w-8 h-8 rounded-md bg-[#202328] border border-[#3a3f47] flex items-center justify-center shrink-0">
              <FolderGit2 className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                Invvestigation  File Required
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Open an Investigation File before accessing case modules.
              </p>

              <button
                onClick={() => {
                  setShowCaseNotice(false);
                  router.push("/cases");
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-slate-300 transition-colors"
              >
                Select Investigation
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => setShowCaseNotice(false)}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <aside className="w-64 shrink-0 bg-[#050505] border-r border-[#1d2127] flex flex-col h-screen sticky top-0 z-30 select-none ">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#1d2127]">
          <div className="w-8 h-8 rounded-md bg-[#171a1f] border border-[#343940] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-sm text-white">
                NEXUS
              </span>

              <span className="px-1.5 py-0.5 rounded border border-[#3a3f47] bg-[#171a1f] text-[9px] text-slate-300">
                INTEL
              </span>
            </div>

            <p className="text-[10px] text-slate-500 tracking-tight">
              AI Investigation Platform
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-600">
            Global Directory
          </div>

          <Link
            href="/cases"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
              isCasesDirectory
                ? "bg-[#191c21] border border-[#555a62] text-white"
                : "text-slate-400 hover:text-white hover:bg-[#12151a]"
            }`}
          >
            <FolderGit2
              className={`w-4 h-4 shrink-0 ${
                isCasesDirectory ? "text-white" : "text-slate-500"
              }`}
            />

            <span className="truncate font-semibold">
              All Investigations
            </span>
          </Link>

          <div className="px-3 mt-7 mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-600">
            Case Modules
          </div>

          <div className="space-y-0.5">
            {navItems.map((item) => {
              const href = getHref(item.subPath);

              const isActive =
                !!activeCaseId &&
                (item.subPath === ""
                  ? pathname === `/cases/${activeCaseId}`
                  : pathname.startsWith(
                      `/cases/${activeCaseId}/${item.subPath}`
                    ));

              const Icon = item.icon;

              if (!activeCaseId) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={showNoCaseNotice}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-[#111419] transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-600" />

                    <span className="truncate">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#191c21] border border-[#555a62] text-white"
                      : "text-slate-400 hover:text-white hover:bg-[#12151a]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                  />

                  <span className="truncate">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-[#1d2127]">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Local Engine Active</span>
          </div>

          <p className="text-[10px] text-slate-600 mt-1">
            Investigative Lead Assistant v1.0
          </p>
        </div>
      </aside>
    </>
  );
}