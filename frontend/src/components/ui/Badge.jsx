import React from "react";

export function Badge({ children, tone = "neutral", className = "" }) {
  const cls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "warn"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : tone === "accent"
          ? "border-forge-accent/30 bg-forge-accent/15 text-forge-text"
          : "border-forge-line bg-white/5 text-forge-muted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${cls} ${className}`}>{children}</span>
  );
}

