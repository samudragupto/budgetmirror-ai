"use client";

/**
 * Lightweight EN/HI dictionary (Phase 3 multi-language UI labels).
 * Covers the citizen-facing report flow and landing highlights;
 * admin stays English-first with Hindi report content supported.
 */
import { createContext, useContext } from "react";

export type UiLang = "en" | "hi";

const dict = {
  reportTitle: { en: "Report a civic need", hi: "नागरिक आवश्यकता दर्ज करें" },
  reportSubtitle: {
    en: "Tell us what your ward needs — water, roads, drains, lights. Anonymous by default.",
    hi: "बताएँ आपके वार्ड को क्या चाहिए — पानी, सड़क, नाली, बिजली। डिफ़ॉल्ट रूप से गुमनाम।",
  },
  yourNeed: { en: "Describe your need", hi: "अपनी आवश्यकता लिखें" },
  yourNeedPh: {
    en: "e.g. There has been no water supply in Ward 5 for three days…",
    hi: "जैसे: वार्ड 5 में तीन दिन से पानी नहीं आ रहा है…",
  },
  ward: { en: "Ward", hi: "वार्ड" },
  language: { en: "Report language", hi: "रिपोर्ट की भाषा" },
  voice: { en: "Speak instead", hi: "बोलकर लिखें" },
  listening: { en: "Listening… speak now", hi: "सुन रहे हैं… बोलें" },
  anonymous: { en: "Keep me anonymous", hi: "मुझे गुमनाम रखें" },
  submit: { en: "Submit report", hi: "रिपोर्ट जमा करें" },
  submitting: { en: "Analyzing…", hi: "विश्लेषण हो रहा है…" },
  micUnsupported: {
    en: "Voice input isn't supported in this browser — please type your report.",
    hi: "इस ब्राउज़र में वॉइस समर्थित नहीं है — कृपया लिखकर भेजें।",
  },
  tracking: { en: "Tracking ID", hi: "ट्रैकिंग आईडी" },
} as const;

export type DictKey = keyof typeof dict;

export const LanguageContext = createContext<{ lang: UiLang; setLang: (l: UiLang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function useLang() {
  const { lang, setLang } = useContext(LanguageContext);
  const t = (key: DictKey): string => dict[key][lang];
  return { lang, setLang, t };
}
