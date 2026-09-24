import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-signal">404 · Missing ledger page</p>
      <h1 className="mt-2 font-serif text-4xl font-bold">No entry by that name</h1>
      <p className="mt-3 text-slateink dark:text-paper/70">
        The page you asked for isn&apos;t in the public ledger. It may have moved — or never existed.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild><Link href="/">Back home</Link></Button>
        <Button asChild variant="outline"><Link href="/transparency">Transparency board</Link></Button>
      </div>
    </div>
  );
}
