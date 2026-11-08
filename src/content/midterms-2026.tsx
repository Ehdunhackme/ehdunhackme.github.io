import type { ReactNode } from "react";
import { renderToString } from "katex";
import "katex/dist/katex.min.css";
import articleData from "./midterms-2026.json";
import styles from "./midterms-2026.module.css";
import { LiveComparison } from "./live-comparison";
import predictions from "../../research/midterms-2026/website/live/predictions.json";
import snapshot from "../../research/midterms-2026/data/results/live-snapshot.json";

const liveConfig = { predictions, snapshot };

type TableBlock = {
  type: "table";
  columns: string[];
  rows: (string | number)[][];
  summary: string | null;
};
type FigureBlock = {
  type: "figure";
  slug: string;
  caption: string;
  alt: string;
  width: number;
  height: number;
  mobileWidth: number;
  mobileHeight: number;
  src: string;
  mobileSrc: string;
};
type Block =
  | { type: "live" }
  | { type: "heading"; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "equation"; text: string; latex: string }
  | TableBlock
  | FigureBlock;
type Article = {
  title: string;
  date: string;
  dateLabel: string;
  note: string;
  blocks: Block[];
  sources: { group: string; label: string; url: string }[];
  reproducibility: string;
};
const article = articleData as Article;
const assets = "/assets/writings/midterms-2026";
const sourceGroups = [
  ...new Set(article.sources.map((source) => source.group)),
];

function ArticleTable({ block }: { block: TableBlock }) {
  const table = (
    <div
      className={styles.tableScroll}
      tabIndex={0}
      role="region"
      aria-label={block.summary || `${block.columns[0]} comparison table`}
    >
      <table>
        <thead>
          <tr>
            {block.columns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, col) =>
                col === 0 ? (
                  <th scope="row" key={col}>
                    {cell}
                  </th>
                ) : (
                  <td key={col}>
                    {typeof cell === "number"
                      ? Number.isInteger(cell)
                        ? cell.toLocaleString("en-US")
                        : cell.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
                      : cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return block.summary ? (
    <details className={styles.details}>
      <summary>{block.summary}</summary>
      {table}
    </details>
  ) : (
    table
  );
}

function ArticleFigure({ block }: { block: FigureBlock }) {
  return (
    <figure className={styles.figure} id={block.slug}>
      <picture>
        <source
          media="(max-width: 640px)"
          srcSet={block.mobileSrc}
          width={block.mobileWidth}
          height={block.mobileHeight}
        />
        {/* Embedded figures remain readable in the offline article export. */}
        <img
          src={block.src}
          width={block.width}
          height={block.height}
          alt={block.alt}
          loading="eager"
          decoding="async"
        />
      </picture>
      <figcaption>
        {block.caption}{" "}
        <a
          href={`${assets}/${block.slug}.svg`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Full size
        </a>
      </figcaption>
    </figure>
  );
}

function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
    case "live":
      return <LiveComparison config={liveConfig} key={index} />;
    case "heading":
      return (
        <h2 id={block.id} key={index}>
          {block.text}
        </h2>
      );
    case "paragraph":
      return <p key={index}>{block.text}</p>;
    case "equation":
      return (
        <div
          className={styles.equation}
          role="region"
          tabIndex={0}
          aria-label={block.text}
          key={index}
          dangerouslySetInnerHTML={{
            __html: renderToString(block.latex, {
              displayMode: true,
              throwOnError: true,
              trust: false,
              output: "htmlAndMathml",
            }),
          }}
        />
      );
    case "table":
      return <ArticleTable block={block} key={index} />;
    case "figure":
      return <ArticleFigure block={block} key={index} />;
  }
}

export function MidtermArticle() {
  return (
    <main className="page writing-page">
      <article
        className={`page-shell writing-post-shell writing-content ${styles.article}`}
      >
        <header className={styles.header}>
          <h1>{article.title}</h1>
          <div className={styles.meta}>
            <time dateTime={article.date}>{article.dateLabel}</time>
            <span>{article.note}</span>
          </div>
        </header>
        {article.blocks.map(renderBlock)}
        <section className={styles.sources} aria-labelledby="midterms-sources">
          <h2 id="midterms-sources">Sources and code</h2>
          <nav className={styles.downloads} aria-label="Code and downloads">
            <a href="https://github.com/Ehdunhackme/ehdunhackme.github.io/tree/main/research/midterms-2026">
              Model code and data
            </a>
            <a href={`${assets}/2026-estimates.csv`} download>
              Estimates CSV
            </a>
            <a href={`${assets}/benchmark-leaderboard.csv`} download>
              Benchmark CSV
            </a>
          </nav>
          <dl className={styles.sourceGroups}>
            {sourceGroups.map((group) => (
              <div key={group}>
                <dt>{group}</dt>
                <dd>
                  {article.sources
                    .filter((source) => source.group === group)
                    .map((source) => (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={source.url}
                      >
                        {source.label}
                      </a>
                    ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </main>
  );
}
