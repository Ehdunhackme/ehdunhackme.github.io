"use client";
import { useRef, useState } from "react";
import { useCardFocus } from "./focus-scope";

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
  const ref = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const projects = kind === "projects";
  useCardFocus(
    ref,
    projects ? ".paper-list > li" : ".writing-section-link",
    query,
  );
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
      ref={ref}
      className={`directory-page${projects ? " project-board paper-showcase-scope" : ""}`}
      data-directory-search=""
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
            placeholder={
              projects
                ? "Search by topic, title, collaborator, or year..."
                : "Search by title, topic, or year..."
            }
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
          <button type="button" hidden={!query} onClick={clear}>
            Clear
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
      <div
        className="directory-search-empty"
        data-search-empty=""
        hidden={count !== 0}
      >
        <h2>No matching {projects ? "projects or papers" : "writings"}</h2>
        <p>
          Try a different {projects ? "topic, name" : "title, topic"}, or year,
          or clear your search.
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
            <h2 id={group.headingId}>{group.title}</h2>
            {list}
          </section>
        ) : (
          <div key={group.id} className="directory-results">
            {list}
          </div>
        );
      })}
    </main>
  );
}
