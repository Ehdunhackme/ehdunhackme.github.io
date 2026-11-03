"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useContactLanguage } from "./contact-language";
const copy = {
  en: {
    title: "Contact",
    intro: "Reach out for research collaborations or academic queries.",
    email: "Email:",
    scholar: "Google Scholar:",
    home: "Home",
  },
  zh: {
    title: "联系",
    intro: "欢迎就研究合作或学术问题与我联系。",
    email: "邮箱：",
    scholar: "谷歌学术：",
    home: "首页",
  },
};
export function Contact() {
  const { language: lang } = useContactLanguage();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "zh" ? "联系 - 曾敦礼" : "Contact — Dun Li Chan";
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);
  const t = copy[lang];
  return (
    <main className="page" lang={lang}>
      <section className="page-shell">
        <h1>{t.title}</h1>
        <p className="page-intro">{t.intro}</p>
        <div className="contact-list">
          <p>
            <strong>{t.email}</strong>{" "}
            <a href="mailto:dunlinmy88@gmail.com">dunlinmy88@gmail.com</a>
          </p>
          <p>
            <strong>GitHub:</strong>{" "}
            <a
              href="https://github.com/ehdunhackme"
              target="_blank"
              rel="noopener"
            >
              github.com/ehdunhackme
            </a>
          </p>
          <p>
            <strong>LinkedIn:</strong>{" "}
            <a
              href="https://www.linkedin.com/in/dun-li-chan"
              target="_blank"
              rel="noopener"
            >
              linkedin.com/in/dun-li-chan
            </a>
          </p>
          <p>
            <strong>{t.scholar}</strong>{" "}
            <a
              href="https://scholar.google.com/citations?user=UOYqiG4AAAAJ"
              target="_blank"
              rel="noopener"
            >
              scholar.google.com
            </a>
          </p>
        </div>
        <nav className="page-links">
          <Link href="/">{t.home}</Link>
        </nav>
      </section>
    </main>
  );
}
