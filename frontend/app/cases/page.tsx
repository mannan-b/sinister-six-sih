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
  <div className="min-h-full bg-[#050505] text-neutral-200 font-sans select-none pb-12">

    {/* TOAST */}
    {toastMessage && (
      <div className="fixed top-20 right-6 z-50 w-[360px] bg-[#111214] border border-[#2a2a2d] shadow-2xl rounded-md">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-100">
              {toastMessage.text}
            </p>

            {toastMessage.caseId && (
              <button
                onClick={() =>
                  router.push(`/cases/${toastMessage.caseId}`)
                }
                className="mt-2 text-xs text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
              >
                Open investigation
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-600 hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}

    {/* PAGE HEADER */}
    <div className="max-w-[1500px] mx-auto px-6 lg:px-8 pt-7">

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#202124]">

        <div>
          {/* Breadcrumb / Context */}
          <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.14em]">
            <span className="text-white font-semibold">
              NEXUS
            </span>

            <span className="text-neutral-700">/</span>

            <span className="text-neutral-500">
              Investigations
            </span>
          </div>

          <div className="flex items-center gap-4">

            <div className="w-11 h-11 flex items-center justify-center rounded-md bg-[#121315] border border-[#2b2d31]">
              <Shield className="w-5 h-5 text-neutral-200" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Investigation Cases
              </h1>

              <p className="mt-1 text-sm text-neutral-500 max-w-2xl">
                Manage active investigations, case intelligence,
                entities, relationships and analytical evidence.
              </p>
            </div>

          </div>
        </div>

        {/* New Case */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="self-start lg:self-end inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New investigation
        </button>

      </div>

      {/* SEARCH / FILTER TOOLBAR */}
      <div className="py-5">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Search */}
          <div className="relative w-full lg:max-w-md">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search investigations..."
              className="
                w-full
                pl-10 pr-4 py-2.5
                bg-[#0c0c0d]
                border border-[#26272a]
                rounded-md
                text-sm text-neutral-200
                placeholder:text-neutral-600
                outline-none
                focus:border-neutral-400
                focus:ring-1
                focus:ring-white/10
                transition-all
              "
            />

          </div>

          {/* Filters */}
          <div className="flex items-center gap-1">

            <span className="text-[11px] uppercase tracking-wider text-neutral-600 mr-2">
              Status
            </span>

            {(["ALL", "ACTIVE", "CLOSED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`
                  px-3 py-1.5
                  text-xs font-medium
                  rounded-md
                  border
                  transition-colors
                  ${
                    statusFilter === st
                      ? "bg-[#e5e5e5] border-[#e5e5e5] text-black"
                      : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-200 hover:bg-[#111214]"
                  }
                `}
              >
                {st === "ALL" ? "All cases" : st}
              </button>
            ))}

            <div className="w-px h-5 bg-[#292a2d] mx-2" />

            <button
              onClick={loadCases}
              className="
                p-2
                rounded-md
                text-neutral-600
                hover:text-neutral-200
                hover:bg-[#111214]
                transition-colors
              "
              title="Refresh cases"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-neutral-200">
            Investigation files
          </h2>

          <span className="text-[11px] px-2 py-0.5 rounded bg-[#111214] border border-[#292a2d] text-neutral-500">
            {cases.length}
          </span>
        </div>

        <span className="text-[11px] text-neutral-600">
          Select a case to access its intelligence workspace
        </span>

      </div>

      {/* CASE CONTENT */}
      {loading ? (
        <LoadingSkeleton text="Loading investigation files..." />
      ) : cases.length === 0 ? (
        <EmptyState
          title="No investigation cases found"
          description={
            searchQuery
              ? `No registered cases match "${searchQuery}".`
              : "No investigation files are currently registered."
          }
          actionLabel="+ Create New Case"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-2 gap-4">

          {cases.map((c) => {

            const fir = c.fir_number || c.case_number;
            const isClosed = c.status === "CLOSED";

            return (
              <div
                key={c.id}
                className={`
                  group
                  bg-[#0c0c0d]
                  border
                  ${isClosed ? "border-[#1d1e21]" : "border-[#28292c]"}
                  rounded-md
                  overflow-hidden
                  transition-all
                  hover:border-[#3a3b3f]
                  ${isClosed ? "opacity-70" : ""}
                `}
              >

                {/* CARD MAIN*/}
                <div className="p-5">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3 min-w-0">

                      <div
                        className="
                          w-9 h-9
                          flex items-center justify-center
                          rounded-md
                          bg-[#141517]
                          border border-[#2b2d31]
                          shrink-0
                        "
                      >
                        <FolderGit2 className="w-4 h-4 text-neutral-200" />
                      </div>

                      <div className="min-w-0">

                        <button
                          onClick={() =>
                            router.push(`/cases/${c.id}`)
                          }
                          className="
                            text-left
                            text-base
                            font-semibold
                            text-neutral-100
                            hover:text-white
                            transition-colors
                            truncate
                            max-w-full
                          "
                        >
                          {c.name}
                        </button>

                        <div className="flex items-center gap-2 mt-1.5">

                          <span className="text-[11px] text-neutral-500">
                            {fir}
                          </span>

                          <span className="text-neutral-700">
                            /
                          </span>

                          <span className="text-[11px] text-neutral-600">
                            Case file
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Status */}
                    <span
                      className={`
                        shrink-0
                        px-2 py-1
                        rounded
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        border
                        ${
                          isClosed
                            ? "bg-[#121315] border-[#2b2d31] text-neutral-500"
                            : " border-emerald-900/70 text-emerald-400"
                        }
                      `}
                    >
                      {c.status}
                    </span>

                  </div>


                  {/* Description */}
                  <p className="mt-5 text-sm text-neutral-500 leading-relaxed line-clamp-2 min-h-[42px]">
                    {c.description ||
                      "No case description has been provided for this investigation."}
                  </p>


                  {/* =================================================
                      CASE METADATA
                  ================================================= */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#202124]">

                    <div className="flex items-start gap-2.5 min-w-0">

                      <Building2 className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-0.5">
                          Jurisdiction
                        </p>

                        <p className="text-xs text-neutral-300 truncate">
                          {c.police_station || "Cyber Crime Cell"}
                        </p>
                      </div>

                    </div>


                    <div className="flex items-start gap-2.5 min-w-0">

                      <User className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-0.5">
                          Investigating officer
                        </p>

                        <p className="text-xs text-neutral-300 truncate">
                          {c.investigating_officer ||
                            "Investigating Officer"}

                          {c.officer_rank && (
                            <span className="text-neutral-600 ml-1">
                              · {c.officer_rank}
                            </span>
                          )}
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      INTELLIGENCE COUNTS
                  ================================================= */}
                  <div className="grid grid-cols-3 gap-px mt-5 bg-[#292a2d] border border-[#292a2d] rounded-md overflow-hidden">

                    <div className="bg-[#101113] px-3 py-3">
                      <p className="text-lg font-semibold text-neutral-100">
                        {c.entity_count || 0}
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-0.5">
                        Entities
                      </p>
                    </div>

                    <div className="bg-[#101113] px-3 py-3">
                      <p className="text-lg font-semibold text-neutral-100">
                        {c.relationship_count || 0}
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-0.5">
                        Relationships
                      </p>
                    </div>

                    <div className="bg-[#101113] px-3 py-3">
                      <p
                        className={`
                          text-lg
                          font-semibold
                          ${
                            (c.alert_count || 0) > 0
                              ? "text-amber-400"
                              : "text-neutral-100"
                          }
                        `}
                      >
                        {c.alert_count || 0}
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-0.5">
                        Alerts
                      </p>
                    </div>

                  </div>

                </div>


                {/* =================================================
                    CARD FOOTER
                ================================================= */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#090a0b] border-t border-[#202124]">

                  <div className="flex items-center gap-1">

                    <button
                      onClick={() => openEditModal(c)}
                      className="
                        p-2
                        rounded-md
                        text-neutral-600
                        hover:text-neutral-200
                        hover:bg-[#161719]
                        transition-colors
                      "
                      title="Edit case details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setClosingCase(c)}
                      className="
                        p-2
                        rounded-md
                        text-neutral-600
                        hover:text-amber-400
                        hover:bg-[#17140d]
                        transition-colors
                      "
                      title={
                        isClosed
                          ? "Reopen case"
                          : "Close case"
                      }
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                  </div>


                  <button
                    onClick={() =>
                      router.push(`/cases/${c.id}`)
                    }
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3.5
                      py-2
                      bg-[#e5e5e5]
                      hover:bg-white
                      border border-[#e5e5e5]
                      text-black
                      text-xs
                      font-medium
                      rounded-md
                      transition-colors
                    "
                  >
                    Open case
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>

    {/*  CREATE CASE MODAL */}
    {showCreateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">

        <div className="w-full max-w-xl bg-[#0d0e10] border border-[#2b2d31] rounded-md shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#222427]">

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1">
                NEXUS / CASE MANAGEMENT
              </p>

              <h3 className="text-base font-semibold text-neutral-100">
                Register new investigation
              </h3>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 text-neutral-600 hover:text-neutral-200 hover:bg-[#161719] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

          </div>


          {/* Error */}
          {createError && (
            <div className="mx-6 mt-5 px-3 py-2.5 bg-[#241214] border border-red-900/70 rounded-md text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}


          {/* Form */}
          <form
            onSubmit={handleCreateSubmit}
            className="p-6 space-y-4"
          >

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Case name
                <span className="text-red-400 ml-1">*</span>
              </label>

              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    name: e.target.value,
                  })
                }
                placeholder="e.g. Operation Dark Eagle"
                className="
                  w-full
                  px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  placeholder:text-neutral-700
                  outline-none
                  focus:border-neutral-400
                  focus:ring-1
                  focus:ring-white/10
                "
              />
            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                FIR number
                <span className="text-red-400 ml-1">*</span>
              </label>

              <input
                type="text"
                required
                value={createForm.fir_number}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    fir_number: e.target.value,
                  })
                }
                placeholder="e.g. FIR-0452/2026"
                className="
                  w-full
                  px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  placeholder:text-neutral-700
                  outline-none
                  focus:border-neutral-400
                  focus:ring-1
                  focus:ring-white/10
                "
              />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Police station
                </label>

                <input
                  type="text"
                  value={createForm.police_station}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      police_station: e.target.value,
                    })
                  }
                  placeholder="e.g. Cyber Crime Cell"
                  className="
                    w-full
                    px-3 py-2.5
                    bg-[#080909]
                    border border-[#292a2d]
                    rounded-md
                    text-sm text-neutral-200
                    placeholder:text-neutral-700
                    outline-none
                    focus:border-neutral-400
                  "
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Officer rank
                </label>

                <input
                  type="text"
                  value={createForm.officer_rank}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      officer_rank: e.target.value,
                    })
                  }
                  placeholder="e.g. Inspector"
                  className="
                    w-full
                    px-3 py-2.5
                    bg-[#080909]
                    border border-[#292a2d]
                    rounded-md
                    text-sm text-neutral-200
                    placeholder:text-neutral-700
                    outline-none
                    focus:border-neutral-400
                  "
                />
              </div>

            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Investigating officer
              </label>

              <input
                type="text"
                value={createForm.investigating_officer}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    investigating_officer: e.target.value,
                  })
                }
                placeholder="e.g. Inspector Rajesh Sharma"
                className="
                  w-full
                  px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  placeholder:text-neutral-700
                  outline-none
                  focus:border-neutral-400
                "
              />
            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Case description
              </label>

              <textarea
                rows={4}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    description: e.target.value,
                  })
                }
                placeholder="Provide scope, involved suspects, incident summary, or jurisdictional notes..."
                className="
                  w-full
                  px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  placeholder:text-neutral-700
                  outline-none
                  focus:border-neutral-400
                  resize-none
                "
              />
            </div>


            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#222427]">

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="
                  px-4 py-2
                  bg-transparent
                  border border-[#2b2d31]
                  hover:bg-[#161719]
                  text-neutral-400
                  hover:text-neutral-200
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  px-4 py-2
                  bg-white
                  hover:bg-neutral-200
                  text-black
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  disabled:opacity-50
                "
              >
                {isSubmitting
                  ? "Registering..."
                  : "Create investigation"}
              </button>

            </div>

          </form>

        </div>
      </div>
    )}


    {/* EDIT CASE MODAL*/}
    {editingCase && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">

        <div className="w-full max-w-xl bg-[#0d0e10] border border-[#2b2d31] rounded-md shadow-2xl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#222427]">

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1">
                NEXUS / CASE MANAGEMENT
              </p>

              <h3 className="text-base font-semibold text-neutral-100">
                Edit investigation
              </h3>
            </div>

            <button
              onClick={() => setEditingCase(null)}
              className="p-2 text-neutral-600 hover:text-neutral-200 hover:bg-[#161719] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

          </div>


          {editError && (
            <div className="mx-6 mt-5 px-3 py-2.5 bg-[#241214] border border-red-900/70 rounded-md text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}


          <form
            onSubmit={handleEditSubmit}
            className="p-6 space-y-4"
          >

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Case name
                <span className="text-red-400 ml-1">*</span>
              </label>

              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    name: e.target.value,
                  })
                }
                className="
                  w-full px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  outline-none
                  focus:border-neutral-400
                  focus:ring-1
                  focus:ring-white/10
                "
              />
            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                FIR number
                <span className="text-red-400 ml-1">*</span>
              </label>

              <input
                type="text"
                required
                value={editForm.fir_number}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    fir_number: e.target.value,
                  })
                }
                className="
                  w-full px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  outline-none
                  focus:border-neutral-400
                  focus:ring-1
                  focus:ring-white/10
                "
              />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Police station
                </label>

                <input
                  type="text"
                  value={editForm.police_station}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      police_station: e.target.value,
                    })
                  }
                  className="
                    w-full px-3 py-2.5
                    bg-[#080909]
                    border border-[#292a2d]
                    rounded-md
                    text-sm text-neutral-200
                    outline-none
                    focus:border-neutral-400
                  "
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Officer rank
                </label>

                <input
                  type="text"
                  value={editForm.officer_rank}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      officer_rank: e.target.value,
                    })
                  }
                  className="
                    w-full px-3 py-2.5
                    bg-[#080909]
                    border border-[#292a2d]
                    rounded-md
                    text-sm text-neutral-200
                    outline-none
                    focus:border-neutral-400
                  "
                />
              </div>

            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Investigating officer
              </label>

              <input
                type="text"
                value={editForm.investigating_officer}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    investigating_officer: e.target.value,
                  })
                }
                className="
                  w-full px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  outline-none
                  focus:border-neutral-400
                "
              />
            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Status
              </label>

              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value,
                  })
                }
                className="
                  w-full px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  outline-none
                  focus:border-neutral-400
                "
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>


            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Case description
              </label>

              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description: e.target.value,
                  })
                }
                className="
                  w-full px-3 py-2.5
                  bg-[#080909]
                  border border-[#292a2d]
                  rounded-md
                  text-sm text-neutral-200
                  outline-none
                  focus:border-neutral-400
                  resize-none
                "
              />
            </div>


            <div className="flex justify-end gap-2 pt-4 border-t border-[#222427]">

              <button
                type="button"
                onClick={() => setEditingCase(null)}
                className="
                  px-4 py-2
                  border border-[#2b2d31]
                  hover:bg-[#161719]
                  text-neutral-400
                  hover:text-neutral-200
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isEditing}
                className="
                  px-4 py-2
                  bg-white
                  hover:bg-neutral-200
                  text-black
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  disabled:opacity-50
                "
              >
                {isEditing ? "Saving..." : "Save changes"}
              </button>

            </div>

          </form>

        </div>
      </div>
    )}


    {/* =========================================================
        CLOSE / REOPEN CASE MODAL
    ========================================================= */}
    {closingCase && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">

        <div className="w-full max-w-md bg-[#0d0e10] border border-[#2b2d31] rounded-md shadow-2xl">

          <div className="p-6">

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 flex items-center justify-center rounded-md bg-[#211a0c] border border-amber-900/60 shrink-0">
                <Archive className="w-4 h-4 text-amber-400" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-neutral-100">
                  {closingCase.status === "ACTIVE"
                    ? "Close investigation?"
                    : "Reopen investigation?"}
                </h3>

                <p className="text-xs text-neutral-500 mt-1">
                  {closingCase.name}
                </p>
              </div>

            </div>


            <div className="mt-5 p-3 bg-[#111214] border border-[#292a2d] rounded-md">

              <p className="text-sm text-neutral-400 leading-relaxed">
                {closingCase.status === "ACTIVE"
                  ? "Closing this case marks it as inactive. All associated entities, graph relationships, financial transactions, and alerts will remain preserved and accessible."
                  : "Reopening this case will restore it to ACTIVE investigation status."}
              </p>

            </div>


            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#222427]">

              <button
                onClick={() => setClosingCase(null)}
                className="
                  px-4 py-2
                  border border-[#2b2d31]
                  hover:bg-[#161719]
                  text-neutral-400
                  hover:text-neutral-200
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                "
              >
                Cancel
              </button>

              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="
                  px-4 py-2
                  bg-amber-600
                  hover:bg-amber-500
                  text-white
                  text-xs
                  font-medium
                  rounded-md
                  transition-colors
                  disabled:opacity-50
                "
              >
                {isUpdatingStatus
                  ? "Updating..."
                  : closingCase.status === "ACTIVE"
                  ? "Confirm close"
                  : "Confirm reopen"}
              </button>

            </div>

          </div>

        </div>
      </div>
    )}

  </div>
);
}
