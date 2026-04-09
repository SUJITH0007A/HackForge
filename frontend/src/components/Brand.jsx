import React from "react";

export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-forge-accent to-forge-accent2 shadow-glow" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">{compact ? "HF" : "HackForge"}</div>
        {!compact ? <div className="text-xs text-forge-muted">Event OS</div> : null}
      </div>
    </div>
  );
}

