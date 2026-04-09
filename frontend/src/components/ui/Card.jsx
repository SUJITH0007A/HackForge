import React from "react";

export function Card({ className = "", children }) {
  return <div className={`rounded-2xl border border-forge-line bg-forge-panel/80 shadow-glow ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-forge-line px-5 py-4">
      <div>
        <div className="text-base font-semibold tracking-tight">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-forge-muted">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

