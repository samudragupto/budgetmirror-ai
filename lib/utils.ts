import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees, compact for large values. */
export function formatINR(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(amount) >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh >= 100 ? (lakh / 100).toFixed(2) + " Cr" : lakh.toFixed(1) + " L"}`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "₹12.0L" style short label for charts. */
export function formatINRShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Deterministic tracking id, e.g. BM-2026-7F3K9Q */
export function makeTrackingId(seed = ""): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let hash = 2166136261;
  const input = `${seed}-${Date.now()}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let code = "";
  for (let i = 0; i < 6; i++) {
    hash = Math.imul(hash ^ (hash >>> 13), 0x5bd1e995);
    code += alphabet[Math.abs(hash) % alphabet.length];
  }
  return `BM-${new Date().getFullYear()}-${code}`;
}
