/**
 * Dependency-free CSV parser + budget-row validator.
 * Handles quoted fields, trims headers, and returns row-level errors so
 * the admin review grid can show exactly what needs fixing.
 */
import { z } from "zod";
import { CATEGORIES } from "./constants";

export const BudgetCsvRowSchema = z.object({
  ward_name: z.string().min(1, "ward_name is required"),
  financial_year: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "financial_year must look like 2025-26"),
  category: z.string().min(1, "category is required"),
  sub_category: z.string().default("General"),
  allocated_amount: z.coerce.number().min(0, "allocated_amount must be >= 0"),
  spent_amount: z.coerce.number().min(0).default(0),
  project_name: z.string().default(""),
  project_status: z.string().default("Planned"),
});

export type BudgetCsvRow = z.infer<typeof BudgetCsvRowSchema>;

export interface ParsedBudgetCsv {
  rows: Array<BudgetCsvRow & { _line: number; _categoryValid: boolean }>;
  errors: Array<{ line: number; message: string }>;
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseBudgetCsv(text: string): ParsedBudgetCsv {
  const rows: ParsedBudgetCsv["rows"] = [];
  const errors: ParsedBudgetCsv["errors"] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows, errors: [{ line: 0, message: "Empty file" }] };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const required = ["ward_name", "financial_year", "category", "allocated_amount"];
  for (const r of required) {
    if (!headers.includes(r)) {
      errors.push({ line: 1, message: `Missing required column: ${r}` });
    }
  }
  if (errors.length > 0) return { rows, errors };

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? "";
    });
    const parsed = BudgetCsvRowSchema.safeParse(obj);
    if (!parsed.success) {
      errors.push({
        line: i + 1,
        message: parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      });
      continue;
    }
    rows.push({
      ...parsed.data,
      _line: i + 1,
      _categoryValid: (CATEGORIES as readonly string[]).includes(parsed.data.category),
    });
  }
  return { rows, errors };
}

/** Match a CSV ward name to a known ward (exact → case-insensitive → contains). */
export function matchWard(
  name: string,
  wards: Array<{ id: string; ward_name: string; ward_no: number | null }>,
): string | null {
  const n = name.trim().toLowerCase();
  const exact = wards.find((w) => w.ward_name.toLowerCase() === n);
  if (exact) return exact.id;
  // "Ward 5" / "5" style references
  const num = n.match(/(\d+)/)?.[1];
  if (num) {
    const byNo = wards.find((w) => w.ward_no === Number(num));
    if (byNo) return byNo.id;
  }
  const contains = wards.find(
    (w) => w.ward_name.toLowerCase().includes(n) || n.includes(w.ward_name.toLowerCase()),
  );
  return contains?.id ?? null;
}
