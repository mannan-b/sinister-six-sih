import React from "react";
import { RiskLevel } from "@/types";

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  className?: string;
}

export function RiskBadge({ level, score, className = "" }: RiskBadgeProps) {
  const normalizedLevel = (level || "LOW").toUpperCase();

  let bg = "bg-zinc-900 border-zinc-700 text-zinc-300";
  let dot = "bg-zinc-400";

  if (normalizedLevel === "CRITICAL") {
    bg = "bg-white text-black border-white font-bold";
    dot = "bg-black animate-pulse";
  } else if (normalizedLevel === "HIGH") {
    bg = "bg-zinc-200 text-black border-zinc-300 font-semibold";
    dot = "bg-black";
  } else if (normalizedLevel === "MODERATE" || normalizedLevel === "MEDIUM") {
    bg = "bg-zinc-800 border-zinc-600 text-zinc-200";
    dot = "bg-zinc-300";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs  font-medium border ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{normalizedLevel}</span>
      {score !== undefined && (
        <span className="opacity-75 border-l border-current/20 pl-1 ml-0.5">
          {score.toFixed(0)}/100
        </span>
      )}
    </span>
  );
}
