"use client";

import React, { useState } from "react";
import { Upload, FileText, PhoneCall, ArrowLeftRight, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { uploadDocument, uploadCdrCsv, uploadTransactionCsv, triggerPipelineAnalysis } from "@/lib/api/analysis";

interface FileUploaderProps {
  caseId: string;
  onUploadSuccess?: () => void;
}

export function FileUploader({ caseId, onUploadSuccess }: FileUploaderProps) {
  const [activeTab, setActiveTab] = useState<"DOC" | "CDR" | "TX">("DOC");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("FIR");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !caseId) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      let result;
      if (activeTab === "DOC") {
        result = await uploadDocument(caseId, selectedFile, docTitle || selectedFile.name, docType);
      } else if (activeTab === "CDR") {
        result = await uploadCdrCsv(caseId, selectedFile);
      } else if (activeTab === "TX") {
        result = await uploadTransactionCsv(caseId, selectedFile);
      }

      setUploadResult(result);
      setSelectedFile(null);
      setDocTitle("");
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process uploaded file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-black border border-zinc-800 space-y-5 text-xs select-none">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => {
            setActiveTab("DOC");
            setUploadResult(null);
            setErrorMessage(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-colors ${
            activeTab === "DOC"
              ? "bg-zinc-900 border border-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>FIR / Police Report (TXT/PDF)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("CDR");
            setUploadResult(null);
            setErrorMessage(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-colors ${
            activeTab === "CDR"
              ? "bg-zinc-900 border border-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>CDR Call Records (CSV)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("TX");
            setUploadResult(null);
            setErrorMessage(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-colors ${
            activeTab === "TX"
              ? "bg-zinc-900 border border-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Financial Transactions (CSV)</span>
        </button>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4">
        {activeTab === "DOC" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. FIR-1023/2026/CRIME-BRANCH"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-200"
              >
                <option value="FIR">First Information Report (FIR)</option>
                <option value="SURVEILLANCE">Surveillance Report</option>
                <option value="INTELLIGENCE">Intelligence Briefing</option>
              </select>
            </div>
          </div>
        )}

        {/* Dropzone Container */}
        <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-6 bg-zinc-950 flex flex-col items-center justify-center text-center transition-colors">
          <Upload className="w-8 h-8 text-zinc-400 mb-2 opacity-80" />
          <p className="text-xs text-zinc-300 font-medium">
            {selectedFile ? selectedFile.name : "Select or drag file to ingest"}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {activeTab === "DOC"
              ? "Supported formats: .txt, .pdf, .docx"
              : "Required CSV with headers: caller, receiver, date, duration or sender, receiver, amount"}
          </p>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mt-3 text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-zinc-200 cursor-pointer"
          />
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback Card */}
        {uploadResult && (
          <div className="p-4 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>File Processed & Integrated into Knowledge Graph</span>
            </div>
            <p className="text-[11px] text-emerald-200">
              {uploadResult.message || `Processed ${uploadResult.records_processed || 0} records.`}
            </p>
            {uploadResult.entities_extracted !== undefined && (
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                <div className="p-2 rounded bg-black border border-emerald-800/60">
                  <span className="text-zinc-400">Entities Extracted:</span>{" "}
                  <strong className="text-white">{uploadResult.entities_extracted}</strong>
                </div>
                <div className="p-2 rounded bg-black border border-emerald-800/60">
                  <span className="text-zinc-400">Relationships Extracted:</span>{" "}
                  <strong className="text-white">{uploadResult.relationships_extracted}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="w-full py-2.5 rounded bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running Extraction & Knowledge Graph Integration...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Process & Ingest File</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
