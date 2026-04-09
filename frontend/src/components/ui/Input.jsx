import React from "react";

export function Input({ label, hint, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label ? <div className="mb-1 text-sm text-forge-muted">{label}</div> : null}
      <input
        className="w-full rounded-xl border border-forge-line bg-forge-panel2/60 px-3 py-2 text-sm outline-none focus:border-forge-accent/60 focus:ring-2 focus:ring-forge-accent/20"
        {...props}
      />
      {hint ? <div className="mt-1 text-xs text-forge-muted">{hint}</div> : null}
    </label>
  );
}

