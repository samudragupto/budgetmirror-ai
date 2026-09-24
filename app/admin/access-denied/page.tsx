import Link from "next/link";

/** A public destination for denied officials; never renders protected data. */
export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16" role="alert">
      <h1 className="font-serif text-3xl font-bold">Access denied</h1>
      <p className="mt-4 text-slateink dark:text-paper/70">
        This account does not have an admin or policymaker role. Creating the login
        in Supabase Auth is not enough — <code className="font-mono text-sm">public.profiles.role</code>
        must be <code className="font-mono text-sm">admin</code> or{" "}
        <code className="font-mono text-sm">policymaker</code> (run{" "}
        <code className="font-mono text-sm">supabase/grant_admin.sql</code>).
        Return to the public site if you are a citizen.
      </p>
      <Link href="/" className="mt-6 inline-block font-medium text-signal hover:underline">Return to public site</Link>
    </div>
  );
}
