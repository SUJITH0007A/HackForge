import React from "react";

export function Button({ variant = "primary", className = "", disabled, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-forge-accent/40 disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "ghost"
      ? "bg-transparent border border-forge-line hover:bg-white/5"
      : variant === "secondary"
        ? "bg-forge-panel2 border border-forge-line hover:bg-white/5"
        : "bg-forge-accent text-white hover:brightness-110";

  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled} {...props}>
      {props.children}
    </button>
  );
}

