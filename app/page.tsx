import Link from "next/link";
import { ArrowRight, Droplets, Mic, Scale, ClipboardCheck, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScorePill } from "@/components/dashboard/score-pill";
import { MetricStrip } from "@/components/dashboard/metric-card";
import { demoSummary } from "@/lib/demo-data";

export default function LandingPage() {
  return (
    <div>
      {/* ---------- Hero: the ledger ---------- */}
      <section className="cadastral-grid border-b border-ink/10 dark:border-paper/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal dark:text-emerald-300">
              Sampurna District · Public ledger · FY 2025-26
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Where the budget goes should match what people need.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slateink dark:text-paper/75">
              BudgetMirror holds three mirrors up to every ward — <strong>citizen needs</strong>,{" "}
              <strong>budget allocations</strong>, and <strong>ground outcomes</strong> — then shows,
              in plain numbers, where spending drifts from need.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/report">
                  <Mic className="size-5" aria-hidden="true" /> Report a need — 60 seconds
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/transparency">
                  See the public ledger <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-slateink/80 dark:text-paper/60">
              Anonymous by default · Hindi, Marathi, Kannada, Tamil, Telugu + English · No Aadhaar, no phone
            </p>
          </div>

          {/* Live ledger excerpt: Ward 5 */}
          <aside aria-label="Live excerpt from the public ledger" className="animate-fade-in">
            <Card className="ledger-card hairline-gold">
              <CardContent className="p-5 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-slateink dark:text-paper/60">
                    Ledger excerpt · Ward 5
                  </p>
                  <Badge variant="coral">Live mismatch</Badge>
                </div>
                <p className="mt-2 font-serif text-2xl font-bold leading-tight">
                  Ujjwal Nagar wants water. The budget bought floodlights.
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-ink/8 pb-2 dark:border-paper/10">
                    <dt className="flex items-center gap-2"><Droplets className="size-4 text-signal" aria-hidden="true" /> Water demand</dt>
                    <dd className="font-mono font-bold">93/100 · 147 reports</dd>
                  </div>
                  <div className="flex items-center justify-between border-b border-ink/8 pb-2 dark:border-paper/10">
                    <dt>Water budget share</dt>
                    <dd className="font-mono font-bold">11%</dd>
                  </div>
                  <div className="flex items-center justify-between border-b border-ink/8 pb-2 dark:border-paper/10">
                    <dt>Decorative lighting share</dt>
                    <dd className="font-mono font-bold">54%</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Alignment score</dt>
                    <dd><ScorePill score={31} /></dd>
                  </div>
                </dl>
                <Button asChild variant="ink" className="mt-4 w-full">
                  <Link href="/transparency">Open the full ledger <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <MetricStrip
            items={[
              { label: "Citizen reports mirrored", value: demoSummary.totalReports.toLocaleString("en-IN") },
              { label: "Wards covered", value: String(demoSummary.wardsCovered) },
              { label: "Critical mismatches", value: String(demoSummary.criticalMismatches) },
              { label: "Citizen validations", value: String(demoSummary.validations) },
            ]}
          />
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="how">
        <h2 id="how" className="font-serif text-3xl font-bold tracking-tight">How the mirror works</h2>
        <p className="mt-2 max-w-2xl text-slateink dark:text-paper/70">
          Three reflections, one honest picture. AI translates and categorises — but every money
          score is deterministic arithmetic you can audit.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              icon: Mic,
              title: "Citizens speak",
              body: "Voice or text, in your language. Anonymous by default. AI translates, categorises into 10 civic sectors, and scores urgency — with a graceful fallback if AI is ever down.",
            },
            {
              n: "02",
              icon: Scale,
              title: "Budgets face the mirror",
              body: "Allocations are uploaded as CSV or PDF, reviewed by officials (never auto-trusted), then compared against demand share. Alignment = 100 − gap × 100. That's the whole trick.",
            },
            {
              n: "03",
              icon: ClipboardCheck,
              title: "Outcomes get verified",
              body: "Projects move through a public lifecycle — Planned to Impact Verified — and only citizen validations can close the loop. No validation, no victory lap.",
            },
          ].map((s) => (
            <Card key={s.n} className="ledger-card">
              <CardContent className="p-5 pt-5">
                <div className="flex items-center justify-between">
                  <s.icon className="size-6 text-signal" aria-hidden="true" />
                  <span className="font-mono text-sm text-ink/30 dark:text-paper/30">{s.n}</span>
                </div>
                <h3 className="mt-3 font-serif text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slateink dark:text-paper/70">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Editorial quote + CTA ---------- */}
      <section className="border-y border-ink/10 bg-ink text-paper dark:border-paper/10 dark:bg-ink-900">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Quote className="size-8 text-gold-light" aria-hidden="true" />
          <blockquote className="mt-4 max-w-3xl font-serif text-2xl italic leading-snug sm:text-3xl">
            “147 water reports against an 11% budget share is not a data gap — it&apos;s a decision
            waiting to happen. The mirror just makes it impossible to unsee.”
          </blockquote>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-paper/60">
            BudgetMirror recommendation engine · Ward 5 · Priority 86
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gold">
              <Link href="/report">Mirror your ward&apos;s needs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-paper/30 text-paper hover:bg-paper/10">
              <Link href="/admin/dashboard">Officials: open the dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="trust">
        <h2 id="trust" className="font-serif text-2xl font-bold">Built to be trusted, not just demoed</h2>
        <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Deterministic money math", "Demand, alignment, priority and impact scores are pure functions — same inputs, same outputs, every time."],
            ["AI never auto-spends", "PDF/CSV extraction always lands in a human review grid before touching the database."],
            ["Anonymous by design", "No Aadhaar, no phone, no identity. Tracking IDs replace personal data."],
            ["Open method", "Formulas, schema, and seed data ship in the repo. Audit everything."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-md border border-ink/12 bg-white p-4 dark:border-paper/15 dark:bg-ink-800">
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-slateink dark:text-paper/70">{b}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
