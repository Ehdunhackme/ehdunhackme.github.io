"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "zh";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
}>({ language: "en", setLanguage: () => {} });

export function ContactLanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    try {
      if (localStorage.getItem("lang") === "zh") setLanguageState("zh");
    } catch {}
  }, []);
  function setLanguage(value: Language) {
    setLanguageState(value);
    try {
      localStorage.setItem("lang", value);
    } catch {}
  }
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useContactLanguage = () => useContext(LanguageContext);

export function ContactLanguageSwitch() {
  const { language, setLanguage } = useContactLanguage();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {(["en", "zh"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={`lang-btn${value === language ? " is-active" : ""}`}
          aria-pressed={value === language}
          onClick={() => setLanguage(value)}
        >
          {value === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}
