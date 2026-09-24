"use client";

/** Official email/password form. The server decides whether local demo is available. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_DISCLAIMER } from "@/lib/constants";

type LoginMode = "live" | "demo" | "unavailable";

export function LoginForm({ mode, accessDenied }: { mode: LoginMode; accessDenied: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleError = error ?? (accessDenied ? "That account isn't an official (admin/policymaker) account." : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const sb = createClient();
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <Card className="ledger-card">
        <CardHeader>
          <CardTitle>Official sign in</CardTitle>
          <CardDescription>
            For municipal officials and policymakers. Citizens never need an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "demo" ? (
            <div className="space-y-4">
              <Alert variant="warn">
                <AlertDescription>
                  Local demo mode — no Supabase connected. Enter the seeded workspace for a demonstration;
                  production requires a configured Supabase project and an official account.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full" size="lg">
                <Link href="/admin/dashboard"><LogIn aria-hidden="true" /> Enter demo workspace</Link>
              </Button>
            </div>
          ) : mode === "unavailable" ? (
            <Alert variant="error">
              <AlertDescription>Admin sign-in is unavailable until Supabase is configured. Contact the site administrator.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {visibleError && <Alert variant="error"><AlertDescription>{visibleError}</AlertDescription></Alert>}
              <div>
                <Label htmlFor="email">Official email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
              </div>
              <Button type="submit" disabled={busy} className="w-full" size="lg">
                <LogIn aria-hidden="true" /> {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-xs text-slateink dark:text-paper/60">{ADMIN_DISCLAIMER}</p>
        </CardContent>
      </Card>
    </div>
  );
}
