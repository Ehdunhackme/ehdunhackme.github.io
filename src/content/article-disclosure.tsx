"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { mountDisclosure } from "./live/disclosure.mjs";

export function ArticleDisclosure({
  summary,
  className,
  children,
}: {
  summary: string;
  className: string;
  children: ReactNode;
}) {
  const element = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (element.current) return mountDisclosure(element.current);
  }, []);
  return (
    <details ref={element} className={className}>
      <summary>{summary}</summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
