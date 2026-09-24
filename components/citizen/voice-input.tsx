"use client";

/**
 * Browser Web Speech API voice input with graceful fallback.
 * No audio leaves the device for transcription — recognition runs in-browser.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

const VOICE_LANG: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export function VoiceInput({
  lang,
  onTranscript,
  disabled,
}: {
  lang: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLang();
  const [supported] = useState(() => getRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recRef.current?.stop(), []);

  if (!supported) {
    return (
      <p className="rounded-md border border-dashed border-ink/20 px-3 py-2 text-xs text-slateink dark:border-paper/20 dark:text-paper/60" role="note">
        {t("micUnsupported")}
      </p>
    );
  }

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = VOICE_LANG[lang] ?? "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from({ length: e.results.length })
        .map((_, i) => e.results[i][0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onTranscript(text);
    };
    rec.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Microphone blocked — allow access or type instead." : `Voice error: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start voice input in this browser.");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={listening ? "coral" : "outline"}
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
        className="w-full sm:w-auto"
      >
        {listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
        {listening ? t("listening") : t("voice")}
      </Button>
      {error && <p className="text-xs text-coral-700 dark:text-orange-300" role="alert">{error}</p>}
    </div>
  );
}
