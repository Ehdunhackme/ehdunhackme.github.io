"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KualaLumpurSkyline } from "./kl-skyline";
import {
  ContactLanguageProvider,
  ContactLanguageSwitch,
} from "./contact-language";

const links = [
  ["/", "Home"],
  ["/about/", "More about me"],
  ["/projects/", "Projects"],
  ["/writings/", "Writings"],
] as const;
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemo = pathname.startsWith("/projects/chert");
  const home = pathname === "/";
  const about = pathname.startsWith("/about");
  const article =
    pathname.startsWith("/writings/") && pathname !== "/writings/";
  const classes = isDemo
    ? "demo-shell"
    : `site-shell ${home || about || article ? "home-style page-layout" : "standard-style directory-layout"} ${home ? "home-page" : ""} ${about ? "about-route" : ""} ${pathname.startsWith("/projects") || pathname.startsWith("/writings") ? "card-subpage" : ""} ${pathname.startsWith("/writings") ? "card-subpage--writing" : ""}`;
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
            {pathname.startsWith("/contact") && (
              <div className="header-actions">
                <ContactLanguageSwitch />
              </div>
            )}
          </header>
        )}
        <div className="route-content" key={pathname}>
          {children}
        </div>
        {!isDemo && (
          <footer className="site-footer">
            <KualaLumpurSkyline />
          </footer>
        )}
      </div>
    </ContactLanguageProvider>
  );
}
