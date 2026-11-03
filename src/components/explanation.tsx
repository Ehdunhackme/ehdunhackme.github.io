"use client";
import { useEffect, useRef } from "react";

export function Explanation({ sections }: { sections: string[][] }) {
  const details = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const targetOpen = useRef(false);
  const cancel = () => {
    animations.current.forEach((a) => {
      a.onfinish = null;
      a.cancel();
    });
    animations.current = [];
  };
  useEffect(
    () => () => {
      animations.current.forEach((a) => a.cancel());
    },
    [],
  );
  function toggle(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    const el = details.current!;
    const content = body.current!;
    targetOpen.current = !targetOpen.current;
    const start = el.getBoundingClientRect().height;
    const opacity = el.open ? getComputedStyle(content).opacity : "0";
    cancel();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.open = targetOpen.current;
      return;
    }
    el.open = true;
    const height = targetOpen.current
      ? el.getBoundingClientRect().height
      : event.currentTarget.getBoundingClientRect().height;
    el.classList.add("is-animating");
    const options = {
      duration: 220,
      easing: "cubic-bezier(.2,.7,.2,1)",
      fill: "both" as const,
    };
    const expand = el.animate(
      [{ height: `${start}px` }, { height: `${height}px` }],
      options,
    );
    animations.current = [
      expand,
      content.animate(
        [{ opacity }, { opacity: targetOpen.current ? 1 : 0 }],
        options,
      ),
    ];
    expand.onfinish = () => {
      el.open = targetOpen.current;
      el.classList.remove("is-animating");
      cancel();
    };
  }
  return (
    <details
      className="paper-explanation"
      ref={details}
      onToggle={() => {
        if (!animations.current.length)
          targetOpen.current = !!details.current?.open;
      }}
    >
      <summary onClick={toggle}>LLM-generated explanation</summary>
      <div ref={body} className="paper-explanation-body">
        <dl>
          {sections.map(([title, text]) => (
            <div key={title} className="explanation-section">
              <dt>{title}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <p className="paper-explanation-note">Generated with GPT-6.1 Sol</p>
      </div>
    </details>
  );
}
