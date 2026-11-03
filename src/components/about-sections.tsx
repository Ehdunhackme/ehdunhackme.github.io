"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Panel = {
  id: string;
  label: string;
  headingId: string;
  content: React.ReactNode;
};

export function AboutSections({ panels }: { panels: Panel[] }) {
  const [view, setView] = useState<{ id: string; anchor: string | null }>({
    id: panels[0].id,
    anchor: null,
  });
  const active = view.id;
  const workspace = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const firstId = panels[0].id;

  useLayoutEffect(() => {
    const sync = () => {
      let hash: string;
      try {
        hash = decodeURIComponent(location.hash.slice(1));
      } catch {
        hash = "";
      }
      const target = hash ? document.getElementById(hash) : null;
      const section = target?.closest<HTMLElement>(".about-reader > section");
      const id =
        section && reader.current?.contains(section) ? section.id : firstId;
      const anchor = section && target !== section ? target?.id || null : null;
      setView((previous) =>
        previous.id === id && previous.anchor === anchor
          ? previous
          : { id, anchor },
      );
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [firstId]);

  useLayoutEffect(() => {
    const target = view.anchor ? document.getElementById(view.anchor) : null;
    const heading = document
      .getElementById(active)
      ?.querySelector<HTMLElement>("h2");
    if (target) {
      target.scrollIntoView({ block: "start", behavior: "instant" });
    } else if (
      shouldFocus.current &&
      workspace.current &&
      workspace.current.getBoundingClientRect().top < 0
    ) {
      workspace.current.scrollIntoView({ block: "start", behavior: "instant" });
    }
    if (shouldFocus.current) {
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      shouldFocus.current = false;
    }
  }, [view, active]);

  return (
    <main className="profile about-page">
      <header className="about-page-header">
        <h1>More about me.</h1>
        <p>The journey so far, what drives me, and a few milestones.</p>
      </header>
      <div className="about-workspace" ref={workspace}>
        <nav className="about-index" aria-label="About sections">
          {panels.map((panel) => (
            <a
              key={panel.id}
              href={`#${panel.id}`}
              aria-current={active === panel.id ? "location" : undefined}
              aria-controls={panel.id}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                if (active === panel.id) return;
                history.pushState(history.state, "", `#${panel.id}`);
                shouldFocus.current = true;
                setView({ id: panel.id, anchor: null });
              }}
            >
              {panel.label === "My journey timeline"
                ? "Journey timeline"
                : panel.label === "My motivations"
                  ? "Motivations"
                  : panel.label}
            </a>
          ))}
        </nav>
        <div className="about-reader" id="about-reader" ref={reader}>
          {panels.map((panel) => (
            <section
              key={panel.id}
              className="content-section"
              id={panel.id}
              aria-labelledby={panel.headingId}
              hidden={active !== panel.id}
            >
              {panel.content}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
