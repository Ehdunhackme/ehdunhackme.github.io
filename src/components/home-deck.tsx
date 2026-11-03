"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";

type Panel = {
  id: string;
  label: string;
  headingId: string;
  content: React.ReactNode;
};
const suits = ["club", "heart", "diamond"];
export function HomeDeck({
  intro,
  panels,
}: {
  intro: React.ReactNode;
  panels: Panel[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const main = useRef<HTMLElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const current = useRef<string | null>(null);
  const desired = useRef<string | null>(null);
  const last = useRef(panels[0].id);
  const revision = useRef(0);
  const animations = useRef<Animation[]>([]);
  const navigateRef = useRef<(id: string | null, update: boolean) => void>(
    () => {},
  );
  const router = useRouter();
  const panelFromHash = () => {
    let hash = location.hash.slice(1);
    try {
      hash = decodeURIComponent(hash);
    } catch {
      return null;
    }
    const target = main.current?.querySelector<HTMLElement>(
      `[id="${CSS.escape(hash)}"]`,
    );
    return (
      target?.closest<HTMLElement>(".about-reader > .content-section")?.id ||
      null
    );
  };
  const cancel = () => {
    animations.current.forEach((a) => a.cancel());
    animations.current = [];
  };
  async function animate(
    element: Element | null | undefined,
    frames: Keyframe[],
    duration: number,
  ) {
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const animation = element.animate(frames, {
      duration,
      easing: "ease-in-out",
      fill: "both",
    });
    animations.current.push(animation);
    await animation.finished.catch(() => {});
  }
  function focusView(id: string | null) {
    const target = id
      ? document.getElementById(id)?.querySelector("h2")
      : deck.current?.querySelector<HTMLElement>(
          `[data-section="${last.current}"]`,
        );
    if (target) {
      target.tabIndex = id ? -1 : 0;
      target.focus({ preventScroll: true });
    }
    (id ? reader.current : deck.current)?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }
  async function navigate(id: string | null, update: boolean) {
    if (desired.current === id) return;
    desired.current = id;
    const ticket = ++revision.current;
    cancel();
    setBusy(true);
    if (update)
      history.pushState(history.state, "", "#" + (id || "about-deck"));
    const from = current.current;
    if (!from && id) {
      await Promise.all(
        [...deck.current!.querySelectorAll<HTMLElement>(".deck-choice")].map(
          (card) =>
            card.dataset.section === id
              ? animate(
                  card.querySelector(".card-turn"),
                  [
                    { transform: "rotateY(0deg)" },
                    { transform: "rotateY(180deg)" },
                  ],
                  280,
                )
              : animate(
                  card,
                  [
                    { opacity: 1 },
                    { opacity: 0, transform: "translateY(8px)" },
                  ],
                  260,
                ),
        ),
      );
    } else if (from)
      await animate(reader.current, [{ opacity: 1 }, { opacity: 0 }], 260);
    if (ticket !== revision.current) return;
    cancel();
    if (id) last.current = id;
    current.current = id;
    flushSync(() => setActive(id));
    focusView(id);
    document.dispatchEvent(new Event("about-section-change"));
    if (id)
      await animate(
        reader.current,
        [
          { opacity: 0, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        360,
      );
    else
      await Promise.all([
        animate(deck.current, [{ opacity: 0 }, { opacity: 1 }], 360),
        animate(
          deck.current?.querySelector(
            `[data-section="${last.current}"] .card-turn`,
          ),
          [{ transform: "rotateY(180deg)" }, { transform: "rotateY(0deg)" }],
          300,
        ),
      ]);
    if (ticket !== revision.current) return;
    cancel();
    setBusy(false);
    const target = id
      ? document.getElementById(id)?.querySelector("h2")
      : deck.current?.querySelector<HTMLElement>(
          `[data-section="${last.current}"]`,
        );
    target?.focus({ preventScroll: true });
  }
  navigateRef.current = navigate;
  useLayoutEffect(() => {
    const id = panelFromHash();
    current.current = desired.current = id;
    if (id) {
      last.current = id;
      setActive(id);
    }
  }, []);
  useEffect(() => {
    const hash = () => {
      if (location.hash === "#research" || location.hash === "#writings") {
        router.replace(
          location.hash === "#research" ? "/projects/" : "/writings/",
        );
        return;
      }
      navigateRef.current(panelFromHash(), false);
    };
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        current.current &&
        !document.querySelector(".gallery-lightbox[open]")
      )
        navigateRef.current(null, true);
    };
    hash();
    window.addEventListener("hashchange", hash);
    window.addEventListener("popstate", hash);
    document.addEventListener("keydown", escape);
    return () => {
      ++revision.current;
      cancel();
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("popstate", hash);
      document.removeEventListener("keydown", escape);
    };
  }, [router]);
  return (
    <main
      className="profile"
      ref={main}
      onClick={(event) => {
        const link = (event.target as Element).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        if (
          !link ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const id = link.hash.slice(1);
        if (panels.some((p) => p.id === id) || id === "about-deck") {
          event.preventDefault();
          if (!busy) void navigate(id === "about-deck" ? null : id, true);
        }
      }}
    >
      <div className="home-intro-content" hidden={!!active}>
        {intro}
      </div>
      <div
        className="about-deck"
        id="about-deck"
        ref={deck}
        hidden={!!active}
        aria-busy={busy}
      >
        <div className="deck-hand" aria-label="Explore about me">
          {panels.map((panel, index) => (
            <button
              key={panel.id}
              type="button"
              className="deck-choice"
              data-section={panel.id}
              aria-controls={panel.id}
              aria-expanded={active === panel.id}
              onClick={() => {
                if (!busy) void navigate(panel.id, true);
              }}
            >
              <span className="playing-card">
                <span className="card-turn">
                  <span className="card-front">
                    <img
                      src={`/assets/cards/${suits[index]}.svg`}
                      alt=""
                      width={120}
                      height={168}
                      loading="eager"
                      decoding="async"
                    />
                  </span>
                  <span className="card-back" aria-hidden="true">
                    <span>DL</span>
                  </span>
                </span>
              </span>
              <span className="deck-label">{panel.label}</span>
            </button>
          ))}
        </div>
        <blockquote className="deck-quote">
          &quot;Life is a deck of cards and this is how I’m playing{" "}
          <span className="deck-quote-ending">mine.&quot;</span>
        </blockquote>
      </div>
      <div
        className="about-reader"
        id="about-reader"
        ref={reader}
        hidden={!active}
        aria-busy={busy}
      >
        <div className="deck-toolbar">
          <button
            type="button"
            className="deck-return"
            onClick={() => {
              if (!busy) void navigate(null, true);
            }}
          >
            ← Back to the cards
          </button>
        </div>
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
    </main>
  );
}
