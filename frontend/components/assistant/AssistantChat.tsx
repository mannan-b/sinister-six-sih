"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, ShieldCheck, AlertCircle, FileText, CornerDownRight, ArrowUpRight } from "lucide-react";
import { AssistantResponse, AssistantEvidenceItem } from "@/types";
import { askAssistant } from "@/lib/api/assistant";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  responseObj?: AssistantResponse;
  timestamp: Date;
}

interface AssistantChatProps {
  caseId: string;
  initialQuery?: string;
}

const DEFAULT_PROMPTS = [
  "How is Rohit Sharma connected to Sameer Khan?",
  "Who are the most influential people in this network?",
  "Which person connects the two largest communities?",
  "Why is Amit Verma considered important?",
  "Show unusual transactions and fund flows",
  "Give me a summary of this investigation",
];

export function AssistantChat({ caseId, initialQuery }: AssistantChatProps) {
  const router = useRouter();
  const [context, setContext] = useState<any>(null);
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!caseId) return;
    const ctxStr = sessionStorage.getItem("assistantContext");
    let ctx = null;
    if (ctxStr) {
      try {
        ctx = JSON.parse(ctxStr);
        setContext(ctx);
        // Clear it so it doesn't leak into future generic visits
        sessionStorage.removeItem("assistantContext");
      } catch (e) {}
    }

    if (ctx) {
      // Initialize with context-aware welcome
      setLoading(true);
      askAssistant(caseId, "INIT_CONTEXT", ctx)
        .then((res) => {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              text: res.answer,
              timestamp: new Date(),
            },
          ]);
          if (res.suggested_queries && res.suggested_queries.length > 0) {
            setPrompts(res.suggested_queries);
          }
        })
        .catch(() => {
          setMessages([{ id: "welcome", role: "assistant", text: "Hello Investigator. Context initialized but failed to generate specific insights.", timestamp: new Date() }]);
        })
        .finally(() => {
          setLoading(false);
          setInitialized(true);
        });
    } else {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: "Hello Investigator. I am NEXUS AI Assistant. I can trace multi-hop network paths, identify intermediary bridge nodes, analyze communication bursts, and explain flagged financial anomalies backed by verifiable knowledge graph evidence.",
          timestamp: new Date(),
        },
      ]);
      setInitialized(true);
    }
  }, [caseId]);

  useEffect(() => {
    if (initialized && initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery, initialized]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || loading || !caseId) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await askAssistant(caseId, q, context);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: res.answer,
        responseObj: res,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.suggested_queries && res.suggested_queries.length > 0) {
        setPrompts(res.suggested_queries);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "I was unable to retrieve graph evidence for that query. Please ensure the case is seeded and active.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg shadow-xl overflow-hidden font-mono select-none">
      {/* Assistant Header */}
      <div className="p-4 border-b border-border bg-surface-raised/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-nexus-900 border border-nexus-700 flex items-center justify-center">
            <Bot className="w-5 h-5 text-nexus-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">NEXUS INVESTIGATION COPILOT</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-[10px] text-emerald-400">
                EVIDENCE RAG
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Local Knowledge Graph Reasoning Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-nexus-400" />
          <span>Strict Evidence Grounding</span>
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-md bg-nexus-950 border border-nexus-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-nexus-400" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-lg p-3.5 text-xs ${
                msg.role === "user"
                  ? "bg-nexus-900/60 border border-nexus-700/50 text-white"
                  : "bg-surface-raised border border-border text-slate-200 space-y-3"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

              {/* Structured Evidence Card */}
              {msg.responseObj && msg.responseObj.evidence && msg.responseObj.evidence.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-nexus-300">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      VERIFIED GRAPH EVIDENCE ({msg.responseObj.evidence.length})
                    </span>
                    <span className="text-slate-400">
                      Confidence: <strong className="text-white">{msg.responseObj.confidence}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {msg.responseObj.evidence.map((ev: AssistantEvidenceItem, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 rounded bg-surface border border-border/60 text-[10px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate">{ev.title}</span>
                          {ev.source && (
                            <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400">
                              {ev.source}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 leading-snug">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clickable Relevant Entities */}
              {msg.responseObj && msg.responseObj.relevant_entities && msg.responseObj.relevant_entities.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400">Linked Subjects:</span>
                  {msg.responseObj.relevant_entities.map((ent: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => router.push(`/explorer?highlight=${ent.id}`)}
                      className="px-2 py-0.5 rounded bg-surface border border-nexus-700/40 text-nexus-300 hover:bg-nexus-900/40 flex items-center gap-1 transition-colors"
                    >
                      <span>{ent.name}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              {/* Ethics Disclaimer */}
              {msg.role === "assistant" && (
                <div className="pt-1 text-[9px] text-slate-400 border-t border-border/40 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>AI-generated investigative lead. Verify against source evidence. The system does not determine guilt.</span>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-md bg-nexus-950 border border-nexus-800 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-nexus-400" />
            </div>
            <div className="rounded-lg p-3 bg-surface-raised border border-border text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-nexus-400 animate-spin" />
              <span>Analyzing graph topology, shortest paths, and anomaly signals...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-surface-raised/40 border-t border-border/50">
        <p className="text-[10px] text-slate-400 mb-1.5">Suggested Investigation Inquiries:</p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded bg-surface border border-border hover:border-nexus-500 hover:text-white text-[10px] text-slate-300 shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="p-3 border-t border-border bg-surface flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about connections, intermediaries, central figures, or unusual transfers..."
          className="flex-1 px-3.5 py-2 rounded bg-surface-raised border border-border focus:border-nexus-500 focus:outline-none text-xs text-white placeholder:text-slate-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="px-4 py-2 rounded bg-nexus-600 hover:bg-nexus-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
