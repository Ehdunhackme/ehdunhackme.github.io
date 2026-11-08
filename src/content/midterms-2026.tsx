import type { ReactNode } from "react";
import articleData from "./midterms-2026.json";
import styles from "./midterms-2026.module.css";

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
};
type Block =
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
  sources: { label: string; url: string }[];
  reproducibility: string;
};
const article = articleData as Article;
const assets = "/assets/writings/midterms-2026";

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
          srcSet={`${assets}/${block.slug}-mobile.svg`}
          width={block.mobileWidth}
          height={block.mobileHeight}
        />
        {/* SVGs preserve the figures' typography and do not need raster optimization. */}
        <img
          src={`${assets}/${block.slug}.svg`}
          width={block.width}
          height={block.height}
          alt={block.alt}
          loading="lazy"
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
          Open figure
        </a>
      </figcaption>
    </figure>
  );
}

function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
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
          role="math"
          aria-label={block.text}
          key={index}
        >
          {block.text}
        </div>
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
        <header className="card-page-heading card-post-heading">
          <div>
            <h1>{article.title}</h1>
            <time className="writing-post-date" dateTime={article.date}>
              {article.dateLabel}
            </time>
          </div>
        </header>
        <p className={styles.note}>{article.note}</p>
        {article.blocks.map(renderBlock)}
        <section className={styles.sources} aria-labelledby="midterms-sources">
          <h2 id="midterms-sources">Data sources and code</h2>
          <ul>
            {article.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p>{article.reproducibility}</p>
          <p>
            <a href={`${assets}/2026-estimates.csv`} download>
              Download race estimates (CSV)
            </a>
            {" / "}
            <a href={`${assets}/historical-cycle-scores.csv`} download>
              Historical validation scores (CSV)
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
