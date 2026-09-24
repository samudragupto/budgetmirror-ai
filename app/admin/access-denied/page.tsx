import Link from "next/link";

/** A public destination for denied officials; never renders protected data. */
export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16" role="alert">
      <h1 className="font-serif text-3xl font-bold">Access denied</h1>
      <p className="mt-4 text-slateink dark:text-paper/70">
        This account does not have an admin or policymaker role. Ask an administrator
        to update your profile, or return to the public site.
      </p>
      <Link href="/" className="mt-6 inline-block font-medium text-signal hover:underline">Return to public site</Link>
    </div>
  );
}
