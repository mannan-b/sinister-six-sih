"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, ShieldCheck, AlertCircle, FileText, CornerDownRight, ArrowUpRight } from "lucide-react";
import { AssistantResponse, AssistantEvidenceItem } from "@/types";
import { askAssistant } from "@/lib/api/assistant";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

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

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await askAssistant(caseId, q, context, historyPayload);
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
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-lg shadow-xl overflow-hidden select-none">
      {/* Assistant Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Bot className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">NEXUS INVESTIGATION COPILOT</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-[10px] text-emerald-400">
                EVIDENCE RAG
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Local Knowledge Graph Reasoning Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
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
              <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-zinc-300" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-lg p-3.5 text-xs ${
                msg.role === "user"
                  ? "bg-zinc-900 border border-zinc-800 text-white"
                  : "bg-black border border-zinc-800 text-zinc-200 space-y-3"
              }`}
            >
              <MarkdownRenderer content={msg.text} />

              {/* Structured Evidence Card */}
              {msg.responseObj && msg.responseObj.evidence && msg.responseObj.evidence.length > 0 && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-300">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-zinc-400" />
                      VERIFIED GRAPH EVIDENCE ({msg.responseObj.evidence.length})
                    </span>
                    <span className="text-zinc-400">
                      Confidence: <strong className="text-white">{msg.responseObj.confidence}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {msg.responseObj.evidence.map((ev: AssistantEvidenceItem, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate">{ev.title}</span>
                          {ev.source && (
                            <span className="px-1 py-0.2 rounded bg-zinc-800 text-[9px] text-zinc-400">
                              {ev.source}
                            </span>
                          )}
                        </div>
                        <MarkdownRenderer content={ev.description} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clickable Relevant Entities */}
              {msg.responseObj && msg.responseObj.relevant_entities && msg.responseObj.relevant_entities.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-zinc-400">Linked Subjects:</span>
                  {msg.responseObj.relevant_entities.map((ent: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => router.push(`/explorer?highlight=${ent.id}`)}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1 transition-colors"
                    >
                      <span>{ent.name}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              {/* Ethics Disclaimer */}
              {msg.role === "assistant" && (
                <div className="pt-1 text-[9px] text-zinc-400 border-t border-zinc-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>AI-generated investigative lead. Verify against source evidence. The system does not determine guilt.</span>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="rounded-lg p-3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-300 animate-spin" />
              <span>Analyzing graph topology, shortest paths, and anomaly signals...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-400 mb-1.5">Suggested Investigation Inquiries:</p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-[10px] text-zinc-300 shrink-0 transition-colors"
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
        className="p-3 border-t border-zinc-800 bg-black flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about connections, intermediaries, central figures, or unusual transfers..."
          className="flex-1 px-3.5 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-white placeholder:text-zinc-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="px-4 py-2 rounded bg-white hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold text-black flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
