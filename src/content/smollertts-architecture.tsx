"use client";

import {useEffect, useRef} from "react";
import {mountArchitecture} from "../../public/projects/smollertts/architecture-renderer.mjs";
import "../../public/projects/smollertts/architecture-embed.css";

// The article and standalone demo share the same diagram and interaction logic.
export function ArchitectureAnimation({peaks}: {peaks: number[]}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const diagram = mountArchitecture(host.current, peaks, {theme: "dark"});
    return () => diagram.destroy();
  }, [peaks]);
  return <div ref={host} />;
}
