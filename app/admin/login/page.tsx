"use client";

/**
 * Official login — Supabase email/password (magic link optional later).
 * In demo mode (no Supabase), one click enters the seeded workspace.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ADMIN_DISCLAIMER } from "@/lib/constants";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "forbidden" ? "That account isn't an official (admin/policymaker) account." : null,
  );

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
          {!isSupabaseConfigured ? (
            <div className="space-y-4">
              <Alert variant="warn">
                <AlertDescription>
                  Demo mode — no Supabase connected. Enter the seeded official workspace directly;
                  connect Supabase + create an admin user for real auth.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full" size="lg">
                <Link href="/admin/dashboard"><LogIn aria-hidden="true" /> Enter demo workspace</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <Alert variant="error"><AlertDescription>{error}</AlertDescription></Alert>}
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-14"><Skeleton className="h-64 w-full" /></div>}>
      <LoginInner />
    </Suspense>
  );
}
