"use client";

import { useMemo, useState } from "react";
import { LanguageContext, type UiLang } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<UiLang>("en");
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Report-language chips (the language the citizen writes/speaks in). */
export function LanguageChips({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
}) {
  return (
    <div>
      <p id="lang-chip-label" className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="lang-chip-label">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => onChange(l.code)}
            aria-pressed={value === l.code}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              value === l.code
                ? "border-signal bg-signal text-white"
                : "border-ink/20 hover:border-signal hover:text-signal dark:border-paper/25",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** UI-language toggle (EN/HI interface labels). */
export function UiLangToggle({ compact = false }: { compact?: boolean }) {
  return (
    <LanguageContext.Consumer>
      {({ lang, setLang }) => (
        <div className={cn("flex items-center gap-1 rounded-full border border-ink/15 p-1 dark:border-paper/20", compact && "text-xs")} role="group" aria-label="Interface language">
          {(["en", "hi"] as UiLang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                lang === l ? "bg-ink text-paper dark:bg-paper dark:text-ink" : "text-slateink dark:text-paper/70",
              )}
            >
              {l === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>
      )}
    </LanguageContext.Consumer>
  );
}
