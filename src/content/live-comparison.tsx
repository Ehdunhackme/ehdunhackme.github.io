"use client";

import { useEffect, useRef } from "react";
import { mountComparison } from "../../research/midterms-2026/website/live/widget.mjs";

export function LiveComparison({ config }: { config: unknown }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current) return mountComparison(host.current, config);
  }, [config]);
  return (
    <div ref={host} id="live-results-comparison">
      <noscript>
        Enable JavaScript to compare the fixed model estimates with live
        results.
      </noscript>
    </div>
  );
}
