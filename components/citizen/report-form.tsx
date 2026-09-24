"use client";

/**
 * Citizen need submission: text + voice + language + ward + anonymous.
 * Posts to /api/analyze-report; the API classifies (or falls back) and
 * persists. Success page receives the tracking id + summary.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VoiceInput } from "@/components/citizen/voice-input";
import { LanguageChips, UiLangToggle } from "@/components/citizen/language-provider";
import { useLang } from "@/lib/i18n";
import { CATEGORIES, CITIZEN_PRIVACY_NOTE, MAX_REPORT_CHARS } from "@/lib/constants";
import type { Ward } from "@/types/report";

interface AnalyzeResponse {
  ok: boolean;
  trackingId?: string;
  reportId?: string;
  analysis?: {
    translatedText: string;
    category: string;
    subCategory: string;
    summary: string;
    urgency: string;
    urgencyScore: number;
    department: string;
    confidence: number;
    aiFailed: boolean;
  };
  error?: string;
}

export function ReportForm({ wards }: { wards: Ward[] }) {
  const router = useRouter();
  const { t } = useLang();
  const [text, setText] = useState("");
  const [wardId, setWardId] = useState(wards.find((w) => w.ward_no === 5)?.id ?? wards[0]?.id ?? "");
  const [language, setLanguage] = useState("en");
  const [manualCategory, setManualCategory] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ward = wards.find((w) => w.id === wardId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 10) {
      setError("Please describe your need in at least a few words (10+ characters).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), wardId, language, manualCategory: manualCategory || undefined, anonymous }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Submission failed. Please try again.");
      sessionStorage.setItem("bm-last-report", JSON.stringify({ ...data, wardName: ward ? `Ward ${ward.ward_no} · ${ward.ward_name}` : "" }));
      router.push(`/report/success?id=${encodeURIComponent(data.trackingId ?? "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{t("reportTitle")}</h1>
        <UiLangToggle />
      </div>
      <p className="max-w-2xl text-slateink dark:text-paper/70">{t("reportSubtitle")}</p>

      {error && (
        <Alert variant="error">
          <AlertTitle>Couldn&apos;t submit</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div>
            <Label htmlFor="need">{t("yourNeed")}</Label>
            <Textarea
              id="need"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_REPORT_CHARS))}
              placeholder={t("yourNeedPh")}
              className="mt-2 min-h-[160px] text-base"
              aria-describedby="need-count privacy-note"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slateink/70 dark:text-paper/50">
              <span id="need-count" className="font-mono">{text.length}/{MAX_REPORT_CHARS}</span>
              <span>AI will translate &amp; categorise — never publishes your identity</span>
            </div>
            <div className="mt-3">
              <VoiceInput lang={language} disabled={submitting} onTranscript={(v) => setText((p) => (p ? `${p} ${v}` : v).slice(0, MAX_REPORT_CHARS))} />
            </div>
          </div>

          <LanguageChips value={language} onChange={setLanguage} label={t("language")} />

          <div>
            <Label htmlFor="category">Category <span className="font-normal text-slateink/70 dark:text-paper/50">(optional — AI suggests one if blank)</span></Label>
            <Select id="category" value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} className="mt-2">
              <option value="">Let AI decide</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-ink/12 bg-white p-4 shadow-card dark:border-paper/15 dark:bg-ink-800">
            <Label htmlFor="ward">{t("ward")}</Label>
            <Select id="ward" value={wardId} onChange={(e) => setWardId(e.target.value)} className="mt-2" required>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_no ? `Ward ${w.ward_no} — ${w.ward_name}` : w.ward_name}
                </option>
              ))}
            </Select>
            {ward?.lat !== null && ward?.lat !== undefined && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slateink dark:text-paper/60">
                <MapPin className="size-3.5" aria-hidden="true" />
                <span className="font-mono">{ward.lat?.toFixed(3)}, {ward.lng?.toFixed(3)}</span>
                <span>· pop. {ward.population?.toLocaleString("en-IN")}</span>
              </p>
            )}
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-1 size-4 accent-[#0F766E]"
              />
              <span>
                <span className="font-medium">{t("anonymous")}</span>
                <span id="privacy-note" className="block text-xs text-slateink/80 dark:text-paper/60">{CITIZEN_PRIVACY_NOTE}</span>
              </span>
            </label>
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            <Send className="size-4" aria-hidden="true" />
            {submitting ? t("submitting") : t("submit")}
          </Button>
          <p className="text-xs leading-relaxed text-slateink/80 dark:text-paper/60">
            By submitting you agree your <em>anonymised</em> words may appear on the public
            transparency board. No name, phone, or Aadhaar is ever collected.
          </p>
        </aside>
      </div>
    </form>
  );
}
