import type {AnchorHTMLAttributes} from "react";
import Link from "next/link";
import styles from "./resource-link.module.css";

type ResourceKind = "github" | "huggingface" | "smollertts" | "chert" | "neurips" | "document" | "code" | "web";

function resourceKind(href: string): ResourceKind {
  if (href.includes("github.com") && /\/blob\/.*\.(md|py|json)/.test(href)) return "code";
  if (href.includes("github.com")) return "github";
  if (href.includes("huggingface.co")) return "huggingface";
  if (href.startsWith("https://neurips.cc/")) return "neurips";
  if (href.startsWith("/projects/smollertts/")) return "smollertts";
  if (href.startsWith("/projects/chert/")) return "chert";
  if (/arxiv\.org|openreview\.net|drive\.google\.com|\.pdf(?:[?#]|$)|^\/writings\//.test(href)) return "document";
  return "web";
}

function ResourceIcon({kind}: {kind: ResourceKind}) {
  const logos = {
    github: "/assets/icons/github.svg",
    huggingface: "/assets/icons/huggingface.svg",
    smollertts: "/projects/smollertts/mark.svg",
    chert: "/assets/logos/chert-square.webp",
    neurips: "/assets/logos/neurips.svg",
  };
  if (kind in logos) {
    return <img className={`${styles.icon} ${kind === "github" ? styles.monochrome : ""}`} src={logos[kind as keyof typeof logos]} width="16" height="16" alt="" />;
  }
  return <svg className={styles.icon} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === "document" ? <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></> : kind === "code" ? <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/> : <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></>}
  </svg>;
}

export function ResourceLink({href, children, kind, className = "", ...props}: AnchorHTMLAttributes<HTMLAnchorElement> & {href: string; kind?: ResourceKind}) {
  const content = <><ResourceIcon kind={kind ?? resourceKind(href)} /><span className={styles.label}>{children}</span><svg className={styles.arrow} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></>;
  const attributes = {...props, className: `${styles.link} ${className}`, "data-resource-link": ""};
  // The standalone demo is a static document rather than a Next.js route.
  if (href.startsWith("/") && !href.startsWith("/projects/smollertts/")) return <Link href={href} {...attributes}>{content}</Link>;
  return <a href={href} {...attributes}>{content}</a>;
}
