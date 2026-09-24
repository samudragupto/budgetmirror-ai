/**
 * Server-side read models with graceful demo fallback.
 * Every getter tries Supabase first; on missing config or query failure
 * it returns the mirrored Sampurna demo dataset so pages always render.
 */
import "server-only";

import { createClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import {
  demoBudgets,
  demoMetrics,
  demoProjects,
  demoReports,
  demoValidations,
  demoWards,
} from "@/lib/demo-data";
import type { Ward, CitizenReport } from "@/types/report";
import type { BudgetAllocation } from "@/types/budget";
import type { Project, ProjectValidation } from "@/types/project";
import type { WardCategoryMetric } from "@/types/metrics";

export interface DataResult<T> {
  data: T;
  demoMode: boolean;
}

async function tryQuery<T>(fn: () => Promise<T>, fallback: T): Promise<DataResult<T>> {
  if (!isSupabaseConfiguredServer) return { data: fallback, demoMode: true };
  try {
    return { data: await fn(), demoMode: false };
  } catch {
    return { data: fallback, demoMode: true };
  }
}

export async function getWards(): Promise<DataResult<Ward[]>> {
  return tryQuery(async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("wards").select("*").order("ward_no");
    if (error) throw error;
    return (data ?? []) as Ward[];
  }, demoWards);
}

export async function getReports(limit = 200): Promise<DataResult<CitizenReport[]>> {
  return tryQuery(async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from("citizen_reports")
      .select("*, ward:wards(id, ward_name, ward_no)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as CitizenReport[];
  }, demoReports);
}

export async function getMetrics(period = "2025-26"): Promise<DataResult<WardCategoryMetric[]>> {
  return tryQuery(async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from("ward_category_metrics")
      .select("*, ward:wards(ward_name, ward_no)")
      .eq("period", period)
      .order("priority_score", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return ((data ?? []) as Array<WardCategoryMetric & { ward?: { ward_name: string; ward_no: number | null } | null }>).map(
      (m) => ({
        ...m,
        ward_name: m.ward
          ? `${m.ward.ward_no ? `Ward ${m.ward.ward_no} · ` : ""}${m.ward.ward_name}`
          : m.ward_name,
      }),
    );
  }, demoMetrics);
}

export async function getBudgets(): Promise<DataResult<BudgetAllocation[]>> {
  return tryQuery(async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from("budget_allocations")
      .select("*")
      .order("allocated_amount", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BudgetAllocation[];
  }, demoBudgets);
}

export async function getProjects(): Promise<DataResult<Project[]>> {
  return tryQuery(async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Project[];
  }, demoProjects);
}

export async function getProject(id: string) {
  if (!isSupabaseConfiguredServer) {
    const project = demoProjects.find((p) => p.id === id) ?? null;
    const validations = demoValidations.filter((v) => v.project_id === id);
    return { project, validations, wardName: wardNameOf(project?.ward_id), demoMode: true };
  }
  try {
    const sb = await createClient();
    const { data: project, error } = await sb.from("projects").select("*").eq("id", id).single();
    if (error) throw error;
    const { data: validations } = await sb
      .from("project_validations")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    let wardName: string | null = null;
    if (project?.ward_id) {
      const { data: w } = await sb.from("wards").select("ward_name, ward_no").eq("id", project.ward_id).single();
      if (w) wardName = `${w.ward_no ? `Ward ${w.ward_no} · ` : ""}${w.ward_name}`;
    }
    return {
      project: project as Project,
      validations: (validations ?? []) as ProjectValidation[],
      wardName,
      demoMode: false,
    };
  } catch {
    const project = demoProjects.find((p) => p.id === id) ?? null;
    return {
      project,
      validations: demoValidations.filter((v) => v.project_id === id),
      wardName: wardNameOf(project?.ward_id),
      demoMode: true,
    };
  }
}

function wardNameOf(wardId: string | null | undefined): string | null {
  if (!wardId) return null;
  const w = demoWards.find((x) => x.id === wardId);
  return w ? `${w.ward_no ? `Ward ${w.ward_no} · ` : ""}${w.ward_name}` : null;
}

export async function getValidations(): Promise<DataResult<ProjectValidation[]>> {
  return tryQuery(async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("project_validations").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []) as ProjectValidation[];
  }, demoValidations);
}
