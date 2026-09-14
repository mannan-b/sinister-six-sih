"use client";

import React, { useState } from "react";
import { Settings, ShieldCheck, AlertCircle, Database, Cpu, Lock, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [provider, setProvider] = useState("local");

  return (
    <div className="space-y-6 select-none max-w-4xl">
      <div className="p-4 rounded-lg bg-black border border-zinc-800">
        <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-zinc-300" />
          <span>System Settings & Investigative Ethics</span>
        </h1>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Configuration parameters, model provider bindings, and legal intelligence disclaimers.
        </p>
      </div>

      {/* Mandatory Ethics & Privacy Banner */}
      <div className="p-5 rounded-lg bg-red-950/20 border border-red-900/50 space-y-3">
        <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
          <ShieldCheck className="w-5 h-5 text-red-400" />
          <span>INVESTIGATIVE INTELLIGENCE & PRIVACY STATEMENT</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          This prototype uses <strong>synthetic data</strong> for demonstration. AI-generated outputs
          are <strong>investigative leads</strong> and must be verified against source evidence.
          The system does <strong>not</strong> determine guilt, criminal liability, or definitive legal verdicts.
        </p>
        <div className="pt-2 flex items-center gap-2 text-[10px] text-zinc-400 border-t border-red-900/30">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>All risk scores (0-100) are transparent weighted indicators based solely on measurable network and activity metrics.</span>
        </div>
      </div>

      {/* AI Engine & Provider Config */}
      <div className="p-5 rounded-lg bg-black border border-zinc-800 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-zinc-300" />
          <span>AI & NLP Reasoning Provider</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div
            onClick={() => setProvider("local")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
              provider === "local"
                ? "bg-zinc-900 border-zinc-600 text-white"
                : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>Local Engine (Default)</span>
              {provider === "local" && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Zero external API requirement. Deterministic graph RAG and rule-based NLP extraction.
            </p>
          </div>

          <div
            onClick={() => setProvider("openai")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
              provider === "openai"
                ? "bg-zinc-900 border-zinc-600 text-white"
                : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>OpenAI GPT-4o</span>
              {provider === "openai" && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Optional augmented synthesis. Auto-falls back to Local Engine if key is unavailable.
            </p>
          </div>

          <div
            onClick={() => setProvider("gemini")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
              provider === "gemini"
                ? "bg-zinc-900 border-zinc-600 text-white"
                : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>Google Gemini</span>
              {provider === "gemini" && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Gemini 1.5 Flash API connector with local fallback resilience.
            </p>
          </div>
        </div>
      </div>

      {/* Backend & Database System Architecture */}
      <div className="p-5 rounded-lg bg-black border border-zinc-800 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-300" />
          <span>System Topology & Specifications</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block text-[10px]">Graph Engine</span>
            <strong className="text-white font-semibold">NetworkX 3.2.1</strong>
          </div>
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block text-[10px]">Anomaly Detector</span>
            <strong className="text-white font-semibold">Isolation Forest</strong>
          </div>
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block text-[10px]">Frontend Stack</span>
            <strong className="text-white font-semibold">Next.js 14 + Cytoscape</strong>
          </div>
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block text-[10px]">Backend Framework</span>
            <strong className="text-white font-semibold">FastAPI + SQLAlchemy</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
