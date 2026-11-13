"use client";
import { useId, useState, type ReactNode } from "react";

export function Explanation({
  sections,
  links,
}: {
  sections: string[][];
  links: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="paper-explanation" data-open={open}>
      <div className="paper-actions">
        <div className="paper-links">{links}</div>
        <button
          id={`${id}-toggle`}
          className="paper-summary-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((previous) => !previous)}
        >
          AI summary <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </div>
      <div
        id={`${id}-panel`}
        className="paper-explanation-panel"
        aria-labelledby={`${id}-toggle`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="paper-explanation-clip">
          <div className="paper-explanation-body">
            <dl>
              {sections.map(([title, text]) => (
                <div key={title} className="explanation-section">
                  <dt>{title}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <p className="paper-explanation-note">Generated with GPT-6 Astra</p>
          </div>
        </div>
      </div>
    </div>
  );
}
