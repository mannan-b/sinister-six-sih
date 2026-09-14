import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "danger" | "warning" | "success" | "info";
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg bg-zinc-950 border border-zinc-800 transition-colors ${onClick ? "cursor-pointer hover:bg-zinc-900 hover:border-zinc-700" : ""
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
          {title}
        </span>
        <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs text-zinc-400">{trend}</span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500 truncate">{subtitle}</p>
      )}
    </div>
  );
}
