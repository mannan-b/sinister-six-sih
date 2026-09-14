import React from "react";
import { User, Phone, Car, MapPin, Building2, CreditCard, Folder, Calendar } from "lucide-react";
import { EntityType } from "@/types";

interface EntityBadgeProps {
  type: EntityType;
  label?: string;
  className?: string;
}

export function EntityBadge({ type, label, className = "" }: EntityBadgeProps) {
  const normType = (type || "UNKNOWN").toUpperCase();

  let Icon = User;
  let style = "bg-zinc-900 border-zinc-700 text-zinc-200";

  if (normType === "PHONE") {
    Icon = Phone;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  } else if (normType === "VEHICLE") {
    Icon = Car;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  } else if (normType === "LOCATION") {
    Icon = MapPin;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  } else if (normType === "ORGANIZATION") {
    Icon = Building2;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  } else if (normType === "BANK_ACCOUNT") {
    Icon = CreditCard;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  } else if (normType === "CASE") {
    Icon = Folder;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  } else if (normType === "DATE") {
    Icon = Calendar;
    style = "bg-zinc-900 border-zinc-700 text-zinc-200";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs  border ${style} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label || normType}</span>
    </span>
  );
}
