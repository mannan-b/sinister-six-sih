"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftRight, Search, AlertTriangle, ShieldCheck } from "lucide-react";
import { fetchCases } from "@/lib/api/cases";
import { fetchTransactions } from "@/lib/api/transactions";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Transaction } from "@/types";

export default function TransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const routeCaseId = params?.caseId as string | undefined;

  const [caseId, setCaseId] = useState<string>(routeCaseId || "");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [searchAccount, setSearchAccount] = useState("");
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
    fetchTransactions({
      case_id: activeCaseId,
      is_anomalous: anomalyOnly ? true : undefined,
      account: searchAccount.trim() || undefined,
      limit: 100,
    })
      .then((data) => setTransactions(data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [activeCaseId, anomalyOnly, searchAccount]);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Header & Controls */}
      <div className="p-4 rounded-lg bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            <span>Financial Transactions & Fund Traces</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Banking ledgers evaluated with anomaly detection ({transactions.length} records)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
              placeholder="Search account..."
              className="w-full pl-8 pr-3 py-1.5 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={anomalyOnly}
              onChange={(e) => setAnomalyOnly(e.target.checked)}
              className="rounded bg-surface-raised border-border text-nexus-600 focus:ring-0"
            />
            <span>Anomalies Only</span>
          </label>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg bg-surface border border-border overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton text="Loading transaction records..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Financial Transactions Found"
              description={
                searchAccount || anomalyOnly
                  ? "No records matched the filter criteria."
                  : "No financial transactions recorded for this investigation."
              }
              actionLabel={searchAccount || anomalyOnly ? undefined : "Upload Bank Statements"}
              onAction={
                searchAccount || anomalyOnly
                  ? undefined
                  : () => router.push(activeCaseId ? `/cases/${activeCaseId}/sources` : "/sources")
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/80 border-b border-border text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Sender Account</th>
                  <th className="px-4 py-3">Receiver Account</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Anomaly Status</th>
                  <th className="px-4 py-3">Detection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-surface-hover/70 transition-colors ${
                      t.is_anomalous ? "bg-red-950/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(t.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{t.sender_account}</div>
                      {t.sender_name && <div className="text-[10px] text-slate-500">{t.sender_name}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{t.receiver_account}</div>
                      {t.receiver_name && <div className="text-[10px] text-slate-500">{t.receiver_name}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      ₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {t.is_anomalous ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-700 text-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          ANOMALOUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 max-w-xs truncate">
                      {t.anomaly_reason || "Within expected transaction bounds"}
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
