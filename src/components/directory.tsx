"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { useCardFocus } from "@/components/focus-scope";

type Entry = {
  id: string;
  searchText: string;
  className?: string;
  content: React.ReactNode;
};
type Group = {
  id: string;
  title?: string;
  headingId?: string;
  entries: Entry[];
};
const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export function Directory({
  kind,
  heading,
  groups,
}: {
  kind: "projects" | "writings";
  heading: React.ReactNode;
  groups: Group[];
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"detailed" | "compact">("detailed");
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const transition = useRef<Animation | null>(null);
  const requestedView = useRef(view);
  const revealNextView = useRef(false);
  useCardFocus(
    results,
    ".paper-list > li, .writing-card-list > li",
    `${query}:${view}`,
  );

  // Keep the same entries mounted so changing density preserves open summaries.
  useLayoutEffect(() => {
    if (!revealNextView.current || !results.current) return;
    revealNextView.current = false;
    transition.current?.cancel();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    transition.current = results.current.animate(
      [
        { opacity: 0, transform: "translateY(3px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }, [view]);

  useLayoutEffect(() => () => transition.current?.cancel(), []);

  const changeView = (next: typeof view) => {
    if (requestedView.current === next) return;
    requestedView.current = next;
    const element = results.current;
    const opacity = element ? getComputedStyle(element).opacity : "1";
    transition.current?.cancel();
    revealNextView.current = false;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setView(next);
      return;
    }
    // Reversing a pending switch restores the current view without a flash.
    const animation = element.animate(
      [{ opacity }, { opacity: next === view ? 1 : 0 }],
      { duration: 100, easing: "ease-out", fill: "forwards" },
    );
    transition.current = animation;
    animation.onfinish = () => {
      if (next === view) {
        animation.cancel();
      } else {
        revealNextView.current = true;
        setView(next);
      }
    };
  };
  const projects = kind === "projects";
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (entry: Entry) =>
    words.every((word) => normalize(entry.searchText).includes(word));
  const total = groups.reduce(
    (count, group) => count + group.entries.length,
    0,
  );
  const count = groups.reduce(
    (count, group) => count + group.entries.filter(matches).length,
    0,
  );
  const clear = () => {
    setQuery("");
    input.current?.focus();
  };
  const id = projects ? "project-search" : "writing-search";
  return (
    <main
      className={`directory-page${projects ? " project-board paper-showcase-scope" : ""}`}
      data-directory-search=""
      data-view={view}
    >
      {heading}
      <form
        className="directory-search"
        role="search"
        aria-label={`Search ${kind}`}
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor={id}>
          {projects ? "Search projects & papers" : "Search writings"}
        </label>
        <div className="directory-search-field">
          <svg
            className="directory-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            ref={input}
            id={id}
            name="q"
            type="search"
            placeholder="Search..."
            aria-controls={groups.map((g) => g.id).join(" ")}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                clear();
              }
            }}
          />
          <button
            className="directory-search-clear"
            type="button"
            hidden={!query}
            onClick={clear}
          >
            Clear
          </button>
        </div>
        <div
          className="directory-view-switch"
          role="group"
          aria-label="Display view"
        >
          <button
            type="button"
            aria-label="Detailed view"
            title="Detailed view"
            aria-pressed={view === "detailed"}
            onClick={() => changeView("detailed")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Compact view"
            title="Compact view"
            aria-pressed={view === "compact"}
            onClick={() => changeView("compact")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 17h10" />
            </svg>
          </button>
        </div>
        <span
          className="directory-search-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {words.length ? `${count} of ${total}` : total}{" "}
          {total === 1 ? "entry" : "entries"}
        </span>
      </form>
      <div ref={results} className="directory-view-content">
        <div
          className="directory-search-empty"
          data-search-empty=""
          hidden={count !== 0}
        >
          <h2>No matching {projects ? "projects or papers" : "writings"}</h2>
          <p>
            Try a different {projects ? "topic, name" : "title, topic"}, or
            year, or clear your search.
          </p>
        </div>
        {groups.map((group) => {
          const list = (
            <ul
              className={
                projects
                  ? "paper-list"
                  : "writing-list writing-posts writing-card-list"
              }
              id={group.id}
            >
              {group.entries.map((entry) => (
                <li
                  key={entry.id}
                  id={entry.id}
                  className={entry.className}
                  hidden={!matches(entry)}
                >
                  {entry.content}
                </li>
              ))}
            </ul>
          );
          return group.title ? (
            <section
              key={group.id}
              className="directory-group"
              aria-labelledby={group.headingId}
              data-search-group=""
              hidden={!group.entries.some(matches)}
            >
              <h2 id={group.headingId}>
                <span className="directory-group-title">{group.title}</span>
                <span className="directory-group-count" aria-hidden="true">
                  {group.entries.filter(matches).length}
                </span>
              </h2>
              {list}
            </section>
          ) : (
            <div key={group.id} className="directory-results">
              {list}
            </div>
          );
        })}
      </div>
    </main>
  );
}
