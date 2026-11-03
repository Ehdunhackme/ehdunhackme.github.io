"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ContactLanguageProvider,
  ContactLanguageSwitch,
} from "./contact-language";

const links = [
  ["/", "Home"],
  ["/projects/", "Projects"],
  ["/writings/", "Writings"],
] as const;
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemo = pathname.startsWith("/projects/chert");
  const home = pathname === "/" || pathname.startsWith("/about");
  const article =
    pathname.startsWith("/writings/") && pathname !== "/writings/";
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.classList.contains("dark"));
    sync();
    const change = (event: StorageEvent) => {
      if (event.key === "theme") {
        document.documentElement.classList.toggle(
          "dark",
          event.newValue
            ? event.newValue === "dark"
            : matchMedia("(prefers-color-scheme: dark)").matches,
        );
        sync();
      }
    };
    window.addEventListener("storage", change);
    return () => window.removeEventListener("storage", change);
  }, []);
  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* Theme still works without storage. */
    }
  }
  const classes = isDemo
    ? "demo-shell"
    : `site-shell ${home || article ? "home-style page-layout" : "standard-style directory-layout"} ${home ? "home-page" : ""} ${pathname.startsWith("/projects") || pathname.startsWith("/writings") ? "card-subpage" : ""} ${pathname.startsWith("/writings") ? "card-subpage--writing" : ""}`;
  return (
    <ContactLanguageProvider>
      <div className={classes}>
        {!isDemo && (
          <header className="site-header">
            <nav className="main-nav" aria-label="Main navigation">
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    (href === "/" ? home : pathname.startsWith(href))
                      ? "page"
                      : undefined
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="header-actions">
              {pathname.startsWith("/contact") && <ContactLanguageSwitch />}
              <button
                type="button"
                id="theme-toggle"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
              >
                <span aria-hidden="true">◐</span>
              </button>
            </div>
          </header>
        )}
        <div className="route-content" key={pathname}>
          {children}
        </div>
        {!isDemo && (
          <footer className="site-footer">
            <span>© 2026 Dun Li Chan</span>
          </footer>
        )}
      </div>
    </ContactLanguageProvider>
  );
}
