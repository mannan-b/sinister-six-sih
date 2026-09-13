"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  Plus,
  Search,
  Shield,
  FileText,
  User,
  Building2,
  CheckCircle2,
  Archive,
  Edit3,
  ExternalLink,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import { fetchCases, createCase, updateCase, updateCaseStatus } from "@/lib/api/cases";
import { Case } from "@/types";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "CLOSED">("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    fir_number: "",
    police_station: "",
    investigating_officer: "",
    officer_rank: "Inspector",
    description: "",
    status: "ACTIVE",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    fir_number: "",
    police_station: "",
    investigating_officer: "",
    officer_rank: "",
    description: "",
    status: "ACTIVE",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Close/Archive Confirmation State
  const [closingCase, setClosingCase] = useState<Case | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Success Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; caseId?: string } | null>(null);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await fetchCases({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setCases(data);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [searchQuery, statusFilter]);

  const showToast = (text: string, caseId?: string) => {
    setToastMessage({ text, caseId });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.name.trim()) {
      setCreateError("Case Name is required.");
      return;
    }
    if (!createForm.fir_number.trim()) {
      setCreateError("FIR Number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newCase = await createCase({
        name: createForm.name.trim(),
        fir_number: createForm.fir_number.trim(),
        police_station: createForm.police_station.trim() || undefined,
        investigating_officer: createForm.investigating_officer.trim() || undefined,
        officer_rank: createForm.officer_rank.trim() || undefined,
        description: createForm.description.trim() || undefined,
        status: createForm.status,
      });

      setShowCreateModal(false);
      setCreateForm({
        name: "",
        fir_number: "",
        police_station: "",
        investigating_officer: "",
        officer_rank: "Inspector",
        description: "",
        status: "ACTIVE",
      });
      showToast(`Case "${newCase.name}" created successfully.`, newCase.id);
      await loadCases();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create case. Please verify FIR number uniqueness.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (c: Case) => {
    setEditingCase(c);
    setEditForm({
      name: c.name || "",
      fir_number: c.fir_number || c.case_number || "",
      police_station: c.police_station || "",
      investigating_officer: c.investigating_officer || "",
      officer_rank: c.officer_rank || "Inspector",
      description: c.description || "",
      status: c.status || "ACTIVE",
    });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;
    setEditError(null);

    if (!editForm.name.trim()) {
      setEditError("Case Name is required.");
      return;
    }
    if (!editForm.fir_number.trim()) {
      setEditError("FIR Number is required.");
      return;
    }

    setIsEditing(true);
    try {
      const updated = await updateCase(editingCase.id, {
        name: editForm.name.trim(),
        fir_number: editForm.fir_number.trim(),
        police_station: editForm.police_station.trim() || undefined,
        investigating_officer: editForm.investigating_officer.trim() || undefined,
        officer_rank: editForm.officer_rank.trim() || undefined,
        description: editForm.description.trim() || undefined,
        status: editForm.status,
      });

      setEditingCase(null);
      showToast(`Case "${updated.name}" updated successfully.`);
      await loadCases();
    } catch (err: any) {
      setEditError(err.message || "Failed to update case.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!closingCase) return;
    setIsUpdatingStatus(true);
    const targetStatus = closingCase.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      await updateCaseStatus(closingCase.id, targetStatus as "ACTIVE" | "CLOSED");
      showToast(
        `Case "${closingCase.name}" marked as ${targetStatus}. All investigation data preserved.`
      );
      setClosingCase(null);
      await loadCases();
    } catch (err: any) {
      alert(err.message || "Failed to update case status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono select-none pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-surface-raised border border-nexus-500/80 shadow-2xl p-4 rounded-lg flex items-center gap-4 text-xs animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-nexus-400 shrink-0" />
          <div>
            <p className="text-white font-semibold">{toastMessage.text}</p>
            {toastMessage.caseId && (
              <button
                onClick={() => router.push(`/cases/${toastMessage.caseId}`)}
                className="text-nexus-400 hover:text-nexus-300 font-bold underline mt-1 flex items-center gap-1"
              >
                <span>Open Investigation Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface rounded-lg border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-nexus-950 border border-nexus-800 text-nexus-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-nexus-400 uppercase tracking-widest">NEXUS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  INVESTIGATIONS PORTAL
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Active Case Files</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Select an investigation to continue intelligence synthesis, multi-modal knowledge graph
            exploration, anomaly detection, and automated entity resolution.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded bg-nexus-600 hover:bg-nexus-500 text-xs font-semibold text-white flex items-center gap-2 transition-colors shadow-glow shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Case</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-lg border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases by name, FIR number, officer..."
            className="w-full pl-9 pr-4 py-1.5 rounded-md bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs font-mono text-slate-200 placeholder:text-slate-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Status:</span>
          {(["ALL", "ACTIVE", "CLOSED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                statusFilter === st
                  ? "bg-nexus-900 text-nexus-300 border border-nexus-600/60 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-raised"
              }`}
            >
              {st === "ALL" ? "All Cases" : st}
            </button>
          ))}
          <button
            onClick={loadCases}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-surface-raised ml-1"
            title="Refresh Cases"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cases List / Grid */}
      {loading ? (
        <LoadingSkeleton text="Loading registered investigation dossiers..." />
      ) : cases.length === 0 ? (
        <EmptyState
          title="No Investigation Cases Found"
          description={
            searchQuery
              ? `No registered cases match search criteria "${searchQuery}".`
              : "No investigation files registered under active status."
          }
          actionLabel="+ Create New Case"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c) => {
            const fir = c.fir_number || c.case_number;
            const isClosed = c.status === "CLOSED";
            return (
              <div
                key={c.id}
                className={`rounded-lg border bg-surface flex flex-col justify-between transition-all hover:border-nexus-600/60 hover:shadow-lg ${
                  isClosed ? "border-slate-800/80 opacity-75" : "border-border"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-nexus-400" />
                        <h2 className="text-sm font-bold text-white tracking-tight hover:text-nexus-300 cursor-pointer" onClick={() => router.push(`/cases/${c.id}`)}>
                          {c.name}
                        </h2>
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-nexus-300 font-mono">
                        {fir}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        isClosed
                          ? "bg-slate-900 border-slate-700 text-slate-400"
                          : "bg-emerald-950/70 border-emerald-800 text-emerald-400"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description || "No case description provided."}
                  </p>

                  {/* Metadata Rows */}
                  <div className="pt-2 border-t border-border/60 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.police_station || "Cyber Crime Cell"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {c.investigating_officer || "Investigating Officer"}
                        {c.officer_rank && (
                          <span className="text-slate-400 ml-1">({c.officer_rank})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Counts Summary */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-mono">
                    <div className="bg-surface-raised/80 p-2 rounded border border-border/40">
                      <div className="font-bold text-white text-xs">{c.entity_count || 0}</div>
                      <div className="text-slate-400">Entities</div>
                    </div>
                    <div className="bg-surface-raised/80 p-2 rounded border border-border/40">
                      <div className="font-bold text-white text-xs">{c.relationship_count || 0}</div>
                      <div className="text-slate-400">Links</div>
                    </div>
                    <div className="bg-surface-raised/80 p-2 rounded border border-border/40">
                      <div className="font-bold text-white text-xs text-orange-400">{c.alert_count || 0}</div>
                      <div className="text-slate-400">Alerts</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-surface-raised/40 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded hover:bg-surface-hover text-slate-400 hover:text-white transition-colors"
                      title="Edit Case Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setClosingCase(c)}
                      className="p-1.5 rounded hover:bg-surface-hover text-slate-400 hover:text-amber-400 transition-colors"
                      title={isClosed ? "Reopen Case" : "Close Case"}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className="px-3.5 py-1.5 rounded bg-nexus-600 hover:bg-nexus-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Open Case</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-5 h-5 text-nexus-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Register New Investigation
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Case Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Operation Dark Eagle"
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  FIR Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fir_number}
                  onChange={(e) => setCreateForm({ ...createForm, fir_number: e.target.value })}
                  placeholder="e.g., FIR-0452/2026"
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Police Station</label>
                  <input
                    type="text"
                    value={createForm.police_station}
                    onChange={(e) => setCreateForm({ ...createForm, police_station: e.target.value })}
                    placeholder="e.g., Cyber Crime Cell"
                    className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Officer Rank</label>
                  <input
                    type="text"
                    value={createForm.officer_rank}
                    onChange={(e) => setCreateForm({ ...createForm, officer_rank: e.target.value })}
                    placeholder="e.g., Inspector"
                    className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Investigating Officer</label>
                <input
                  type="text"
                  value={createForm.investigating_officer}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, investigating_officer: e.target.value })
                  }
                  placeholder="e.g., Inspector Rajesh Sharma"
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Case Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Provide scope, involved suspects, incident summary, or jurisdictional notes..."
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-surface-raised hover:bg-surface-hover border border-border text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-nexus-600 hover:bg-nexus-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Registering Case..." : "Create Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CASE MODAL */}
      {editingCase && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-nexus-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit Investigation Details
                </h3>
              </div>
              <button onClick={() => setEditingCase(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Case Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  FIR Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fir_number}
                  onChange={(e) => setEditForm({ ...editForm, fir_number: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Police Station</label>
                  <input
                    type="text"
                    value={editForm.police_station}
                    onChange={(e) => setEditForm({ ...editForm, police_station: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Officer Rank</label>
                  <input
                    type="text"
                    value={editForm.officer_rank}
                    onChange={(e) => setEditForm({ ...editForm, officer_rank: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Investigating Officer</label>
                <input
                  type="text"
                  value={editForm.investigating_officer}
                  onChange={(e) =>
                    setEditForm({ ...editForm, investigating_officer: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Case Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-4 py-2 rounded bg-surface-raised hover:bg-surface-hover border border-border text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2 rounded bg-nexus-600 hover:bg-nexus-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE / ARCHIVE CONFIRMATION MODAL */}
      {closingCase && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {closingCase.status === "ACTIVE" ? "Close Investigation?" : "Reopen Investigation?"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{closingCase.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {closingCase.status === "ACTIVE"
                ? "Closing this case marks it as inactive. All associated entities, graph relationships, financial transactions, and alerts will remain preserved and accessible."
                : "Reopening this case will restore it to ACTIVE investigation status."}
            </p>

            <div className="pt-3 border-t border-border flex justify-end gap-3 text-xs">
              <button
                onClick={() => setClosingCase(null)}
                className="px-4 py-2 rounded bg-surface-raised hover:bg-surface-hover border border-border text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                {isUpdatingStatus
                  ? "Updating..."
                  : closingCase.status === "ACTIVE"
                  ? "Confirm Close"
                  : "Confirm Reopen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
