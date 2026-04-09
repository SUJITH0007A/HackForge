import React from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../components/Brand.jsx";
import { Button } from "../../components/ui/Button.jsx";

export function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <BrandMark />
      <div className="mt-10 rounded-2xl border border-forge-line bg-forge-panel/70 px-6 py-6">
        <div className="text-xl font-semibold">Page not found</div>
        <div className="mt-2 text-sm text-forge-muted">The page you’re looking for doesn’t exist.</div>
        <div className="mt-4 flex gap-3">
          <Link to="/">
            <Button>Home</Button>
          </Link>
          <Link to="/events">
            <Button variant="secondary">Browse events</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

